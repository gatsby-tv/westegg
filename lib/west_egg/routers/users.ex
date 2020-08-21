defmodule WestEgg.Routers.Users do
  use Plug.Router
  alias WestEgg.{Auth, Batch, Channel, Show, Video Error, Registry, User, Secrets}

  plug :match
  plug :dispatch

  post "/:handle" do
    get_batch = fn handle ->
      profile =
        conn.params
        |> User.Profile.from_binary_map()
        |> Map.put(:id, handle.id)

      add_hash = &{&1, Map.fetch!(Argon2.add_hash(&1), :password_hash)}

      login =
        conn.body_params
        |> Secrets.Login.from_binary_map()
        |> Map.get_and_update(:password, add_hash)
        |> elem(1)
        |> Map.put(:id, handle.id)

      Batch.new()
      |> Registry.handle(:insert, handle)
      |> User.profile(:insert, profile)
      |> Secrets.login(:insert, login)
      |> Batch.compile(:logged)
    end

    with {:ok, handle} <- Registry.Handle.new(:user, handle),
         {:ok, batch} <- get_batch.(handle) do
      Batch.execute!(batch)
      send_resp(conn, :created, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  delete "/:handle" do
    get_batch = fn
      :logged, id, handle, channels, shows, videos ->
        delete_owners = fn batch, type, objects ->
          key =
            type
            |> Module.split()
            |> Enum.fetch!(-1)
            |> String.downcase()

          Enum.reduce(objects, batch, fn %{^key => object}, batch ->
            owner =
              type
              |> Module.concat(Owner)
              |> struct(%{id: object, owner: id})

            type.owners(batch, :delete, owner)
          end)
        end

        Batch.new()
        |> Registry.handle(:delete, %Registry.Handle{id: id, handle: handle})
        |> User.profile(:delete, %User.Profile{id: id})
        |> Secrets.login(:delete, %Secrets.Login{id: id})
        |> delete_owners.(Channel, channels)
        |> delete_owners.(Show, shows)
        |> delete_owners.(Video, videos)
        |> Batch.compile(:logged)

      :counter, _id, _handle, channels, shows, videos ->
        decrement_owners = fn batch, type, objects ->
          key =
            type
            |> Module.split()
            |> Enum.fetch!(-1)
            |> String.downcase()

          Enum.reduce(objects, batch, fn %{^key => object}, batch ->
            statistics =
              type
              |> Module.concat(Statistics)
              |> struct(%{id: object, owner: 1})

            type.statistics(batch, :decrement, statistics)
          end)
        end

        Batch.new()
        |> decrement_owners.(Channel, channels)
        |> decrement_owners.(Show, shows)
        |> decrement_owners.(Video, videos)
        |> Batch.compile(:counter)
    end

    with {:ok, user} <- Registry.Handle.from_keywords(user: handle),
         :ok <- Auth.verified?(conn, as: user.id),
         {:ok, channels} <- User.channels(:select, %User.Channel{id: user.id}),
         {:ok, shows} <- User.shows(:select, %User.Show{id: user.id}),
         {:ok, videos} <- User.videos(:select, %User.Video{id: user.id}),
         {:ok, logged} <- get_batch.(:logged, user.id, user.handle, channels, shows, videos),
         {:ok, counter} <- get_batch.(:counter, user.id, user.handle, channels, shows, videos) do
      Batch.execute!([logged, counter])
      send_resp(conn, :ok, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/profile" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, profile} <- User.profile(:select, %User.Profile{id: id}),
         {:ok, resp} <- Poison.encode(profile) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  put "/:handle/profile" do
    profile = User.Profile.from_binary_map(conn.params)

    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         :ok <- Auth.verified?(conn, as: id),
         :ok <- User.profile(:update, Map.put(profile, :id, id)) do
      send_resp(conn, :accepted, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  post "/:handle/follower" do
    session = get_session(conn, "id")

    get_batch = fn
      :logged, follow, follower ->
        Batch.new()
        |> User.followers(:insert, %User.Follower{id: follow, follower: follower})
        |> User.follows(:insert, %User.Follow{id: follower, follow: follow})
        |> Batch.compile(:logged)

      :counter, follow, follower ->
        Batch.new()
        |> User.statistics(:increment, %User.Statistics{id: follow, followers: 1})
        |> User.statistics(:increment, %User.Statistics{id: follower, follows: 1})
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [user, session]} <- Registry.Handle.from_keywords(user: handle, user: session),
         {:ok, logged} <- get_batch.(:logged, user.id, session.id),
         {:ok, counter} <- get_batch.(:counter, user.id, session.id) do
      Batch.execute!([logged, counter])
      send_resp(conn, :created, "ok")
    else
      {:error, {:conflict, :follower, _} = reason} ->
        raise Error, reason: reason, message: "attempt to follow oneself"

      {:error, reason} ->
        raise Error, reason: reason
    end
  end

  delete "/:handle/follower" do
    session = get_session(conn, "id")

    get_batch = fn
      :logged, follow, follower ->
        Batch.new()
        |> User.followers(:delete, %User.Follower{id: follow, follower: follower})
        |> User.follows(:delete, %User.Follow{id: follower, follow: follow})
        |> Batch.compile(:logged)

      :counter, follow, follower ->
        Batch.new()
        |> User.statistics(:decrement, %User.Statistics{id: follow, followers: 1})
        |> User.statistics(:decrement, %User.Statistics{id: follower, follows: 1})
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [user, session]} <- Registry.Handle.from_keywords(user: handle, user: session),
         {:ok, logged} <- get_batch.(:logged, user.id, session.id),
         {:ok, counter} <- get_batch.(:counter, user.id, session.id) do
      Batch.execute!([logged, counter])
      send_resp(conn, :ok, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/followers" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Follower.page(%User.Follower{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/follows" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Follow.page(%User.Follow{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/subscriptions" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Subscription.page(%User.Subscription{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/promotions" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Promotion.page(%User.Promotion{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/channels" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Channel.page(%User.Channel{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/shows" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Show.page(%User.Show{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/videos" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, page} <- User.Video.page(%User.Video{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
