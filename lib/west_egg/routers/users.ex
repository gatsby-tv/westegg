defmodule WestEgg.Routers.Users do
  use Plug.Router
  alias WestEgg.{Auth, Batch, Registry, User, Secrets}

  plug :match
  plug :dispatch

  post "/:handle" do
    get_batch = fn handle ->
      profile =
        conn.params
        |> User.Profile.from_binary_map()
        |> Map.merge(Map.from_struct(handle))

      add_hash = &{&1, Map.fetch!(Argon2.add_hash(&1), :password_hash)}

      login =
        conn.body_params
        |> Secrets.Login.from_binary_map()
        |> Map.get_and_update(:password, add_hash)
        |> elem(1)
        |> Map.merge(Map.from_struct(handle))

      Batch.new()
      |> Registry.handle(:insert, handle)
      |> User.profile(:insert, profile)
      |> Secrets.login(:insert, login)
      |> Batch.compile()
    end

    with {:ok, handle} <- Registry.Handle.new(:user, handle),
         {:ok, batch} <- get_batch.(handle) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, {:exists, :handle, %{handle: handle}}} ->
        send_resp(conn, :conflict, "handle #{handle} already exists")
    end
  end

  delete "/:handle" do
    get_batch = fn id, handle ->
      Batch.new()
      |> Registry.handle(:delete, %Registry.Handle{id: id, handle: handle})
      |> User.profile(:delete, %User.Profile{id: id})
      |> Secrets.login(:delete, %Secrets.Login{id: id})
      |> Batch.compile()
    end

    with {:ok, user} <- Registry.Handle.from_keywords(user: handle),
         :ok <- Auth.verified?(conn, as: user.id),
         {:ok, batch} <- get_batch.(user.id, user.handle) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :handle, %{handle: handle}}} ->
        send_resp(conn, :not_found, "handle #{handle} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
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
      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  put "/:handle/profile" do
    profile = User.Profile.from_binary_map(conn.params)

    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         :ok <- Auth.verified?(conn, as: id),
         :ok <- User.profile(:update, Map.put(profile, :id, id)) do
      send_resp(conn, :accepted, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  post "/:handle/follower" do
    session = get_session(conn, "id")

    get_batch = fn follow, follower ->
      Batch.new()
      |> User.followers(:insert, %User.Follower{id: follow, follower: follower})
      |> User.follows(:insert, %User.Follow{id: follower, follow: follow})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [user, session]} <- Registry.Handle.from_keywords(user: handle, user: session),
         {:ok, batch} <- get_batch.(user.id, session.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "session not verified")

      {:error, {:exists, :follower, _}} ->
        send_resp(conn, :conflict, "follower already exists")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  delete "/:handle/follower" do
    session = get_session(conn, "id")

    get_batch = fn follow, follower ->
      Batch.new()
      |> User.followers(:delete, %User.Follower{id: follow, follower: follower})
      |> User.follows(:delete, %User.Follow{id: follower, follow: follow})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [user, session]} <- Registry.Handle.from_keywords(user: handle, user: session),
         {:ok, batch} <- get_batch.(user.id, session.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "session not verified")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
