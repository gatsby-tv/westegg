defmodule WestEgg.Routers.Channels do
  use Plug.Router
  alias WestEgg.{Auth, Batch, Channel, Error, Registry, User}

  plug :match
  plug :dispatch

  post "/:handle" do
    session = get_session(conn, "id")

    get_owners = fn ->
      [session | Map.get(conn.body_params, "owners", [])]
      |> Keyword.new(&{:user, &1})
      |> Registry.Handle.from_keywords()
    end

    get_batch = fn
      :logged, handle, owners ->
        profile =
          conn.params
          |> Channel.Profile.from_binary_map()
          |> Map.put(:id, handle.id)

        insert_owners =
          &Enum.reduce(&2, &1, fn owner, batch ->
            batch
            |> Channel.owners(:insert, %Channel.Owner{id: handle.id, owner: owner.id})
            |> User.channels(:insert, %User.Channel{id: owner.id, channel: handle.id})
          end)

        Batch.new()
        |> Registry.handle(:insert, handle)
        |> Channel.profile(:insert, profile)
        |> insert_owners.(owners)
        |> Batch.compile(:logged)

      :counter, handle, owners ->
        count = length(owners)

        increment_owners =
          &Enum.reduce(&2, &1, fn owner, batch ->
            User.statistics(batch, :increment, %User.Statistics{id: owner.id, channels: 1})
          end)

        Batch.new()
        |> Channel.statistics(:increment, %Channel.Statistics{id: handle.id, owners: count})
        |> increment_owners.(owners)
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.Handle.new(:channel, handle),
         {:ok, owners} <- get_owners.(),
         {:ok, logged} <- get_batch.(:logged, handle, List.wrap(owners)),
         {:ok, counter} <- get_batch.(:counter, handle, List.wrap(owners)) do
      Batch.execute!([logged, counter])
      send_resp(conn, :created, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  delete "/:handle" do
    delete_owners =
      &Enum.reduce(&2, &1, fn %{"owner" => owner}, batch ->
        batch
        |> Channel.owners(:delete, %Channel.Owner{id: &3, owner: owner})
        |> User.channels(:delete, %User.Channel{id: owner, channel: &3})
      end)

    decrement_owners =
      &Enum.reduce(&2, &1, fn %{"owner" => owner}, batch ->
        User.statistics(batch, :decrement, %User.Statistics{id: owner, channels: 1})
      end)

    get_batch = fn
      :logged, handle, owners ->
        Batch.new()
        |> Registry.handle(:delete, handle)
        |> Channel.profile(:delete, %Channel.Profile{id: handle.id})
        |> delete_owners.(owners, handle.id)
        |> Batch.compile(:logged)

      :counter, _handle, owners ->
        Batch.new()
        |> decrement_owners.(owners)
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.Handle.from_keywords(channel: handle),
         :ok <- Auth.owns?(conn, Channel, handle.id),
         {:ok, owners} <- Channel.owners(:select, %Channel.Owner{id: handle.id}),
         {:ok, logged} <- get_batch.(:logged, handle, owners),
         {:ok, counter} <- get_batch.(:counter, handle, owners) do
      Batch.execute!([logged, counter])
      send_resp(conn, :ok, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/profile" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(channel: handle),
         {:ok, profile} <- Channel.profile(:select, %Channel.Profile{id: id}),
         {:ok, resp} <- Poison.encode(profile) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  put "/:handle/profile" do
    profile = Channel.Profile.from_binary_map(conn.params)

    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(channel: handle),
         :ok <- Auth.verified?(conn),
         :ok <- Auth.owns?(conn, Channel, id),
         :ok <- Channel.profile(:update, Map.put(profile, :id, id)) do
      send_resp(conn, :accepted, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  post "/:handle/owner" do
    owner = conn.params["owner"]

    get_batch = fn
      :logged, channel, owner ->
        Batch.new()
        |> Channel.owners(:insert, %Channel.Owner{id: channel, owner: owner})
        |> User.channels(:insert, %User.Channel{id: owner, channel: channel})
        |> Batch.compile(:logged)

      :counter, channel, owner ->
        Batch.new()
        |> Channel.statistics(:increment, %Channel.Statistics{id: channel, owners: 1})
        |> User.statistics(:increment, %User.Statistics{id: owner, channels: 1})
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [channel, owner]} <- Registry.Handle.from_keywords(channel: handle, user: owner),
         :ok <- Auth.owns?(conn, Channel, channel.id),
         {:ok, logged} <- get_batch.(:logged, channel.id, owner.id),
         {:ok, counter} <- get_batch.(:counter, channel.id, owner.id) do
      Batch.execute!([logged, counter])
      send_resp(conn, :created, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  delete "/:handle/owner" do
    owner = conn.params["owner"]

    get_batch = fn
      :logged, channel, owner ->
        Batch.new()
        |> Channel.owners(:delete, %Channel.Owner{id: channel, owner: owner})
        |> User.channels(:delete, %User.Channel{id: owner, channel: channel})
        |> Batch.compile(:logged)

      :counter, channel, owner ->
        Batch.new()
        |> Channel.statistics(:decrement, %Channel.Statistics{id: channel, owners: 1})
        |> User.statistics(:decrement, %User.Statistics{id: owner, channels: 1})
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [channel, owner]} <- Registry.Handle.from_keywords(channel: handle, user: owner),
         :ok <- Auth.owns?(conn, Channel, channel.id),
         {:ok, logged} <- get_batch.(:logged, channel.id, owner.id),
         {:ok, counter} <- get_batch.(:counter, channel.id, owner.id) do
      Batch.execute!([logged, counter])
      send_resp(conn, :ok, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/owners" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(channel: handle),
         {:ok, page} <- Channel.Owner.page(%Channel.Owner{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  post "/:handle/subscriber" do
    session = get_session(conn, "id")

    get_batch = fn
      :logged, channel, user ->
        Batch.new()
        |> Channel.subscribers(:insert, %Channel.Subscriber{id: channel, subscriber: user})
        |> User.subscriptions(:insert, %User.Subscription{id: user, subscription: channel})
        |> Batch.compile(:logged)

      :counter, channel, user ->
        Batch.new()
        |> Channel.statistics(:increment, %Channel.Statistics{id: channel, subscribers: 1})
        |> User.statistics(:increment, %User.Statistics{id: user, subscriptions: 1})
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [channel, user]} <- Registry.Handle.from_keywords(channel: handle, user: session),
         {:ok, logged} <- get_batch.(:logged, channel.id, user.id),
         {:ok, counter} <- get_batch.(:counter, channel.id, user.id) do
      Batch.execute!([logged, counter])
      send_resp(conn, :created, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  delete "/:handle/subscriber" do
    session = get_session(conn, "id")

    get_batch = fn
      :logged, channel, user ->
        Batch.new()
        |> Channel.subscribers(:delete, %Channel.Subscriber{id: channel, subscriber: user})
        |> User.subscriptions(:delete, %User.Subscription{id: user, subscription: channel})
        |> Batch.compile(:logged)

      :counter, channel, user ->
        Batch.new()
        |> Channel.statistics(:decrement, %Channel.Statistics{id: channel, subscribers: 1})
        |> User.statistics(:decrement, %User.Statistics{id: user, subscriptions: 1})
        |> Batch.compile(:counter)
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [channel, user]} <- Registry.Handle.from_keywords(channel: handle, user: session),
         {:ok, logged} <- get_batch.(:logged, channel.id, user.id),
         {:ok, counter} <- get_batch.(:counter, channel.id, user.id) do
      Batch.execute!([logged, counter])
      send_resp(conn, :ok, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/subscribers" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(channel: handle),
         {:ok, page} <- Channel.Subscriber.page(%Channel.Subscriber{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/shows" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(channel: handle),
         {:ok, page} <- Channel.Show.page(%Channel.Show{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/videos" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(channel: handle),
         {:ok, page} <- Channel.Video.page(%Channel.Video{id: id}, conn.params),
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
