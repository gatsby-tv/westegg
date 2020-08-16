defmodule WestEgg.Routers.Shows do
  use Plug.Router
  alias WestEgg.{Auth, Batch, Channel, Registry, Show, User}

  plug :match
  plug :dispatch

  post "/:scope/:handle" do
    session = get_session(conn, "id")

    get_owners = fn ->
      [session | Map.get(conn.body_params, "owners", [])]
      |> Keyword.new(&{:user, &1})
      |> Registry.Handle.from_keywords()
    end

    get_batch = fn handle, owners ->
      profile =
        conn.params
        |> Show.Profile.from_binary_map()
        |> Map.merge(Map.from_struct(handle))

      insert_owners =
        &Enum.reduce(&2, &1, fn owner, batch ->
          batch
          |> Show.owners(:insert, %Show.Owner{id: handle.id, owner: owner.id})
          |> User.shows(:insert, %User.Show{id: owner.id, show: handle.id})
        end)

      Batch.new()
      |> Registry.handle(:insert, handle)
      |> Show.profile(:insert, profile)
      |> Channel.shows(:insert, %Channel.Show{id: handle.scope, show: handle.id})
      |> insert_owners.(owners)
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.ScopedHandle.new(:show, {scope, handle}),
         {:ok, owners} <- get_owners.(),
         {:ok, batch} <- get_batch.(handle, List.wrap(owners)) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:exists, :handle, %{handle: handle}}} ->
        send_resp(conn, :conflict, "handle #{handle} already exists")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")

      {:error, {:not_found, :channel, channel}} ->
        send_resp(conn, :not_found, "channel #{channel} not found")
    end
  end

  delete "/:scope/:handle" do
    delete_owners =
      &Enum.reduce(&2, &1, fn %{"owner" => owner}, batch ->
        batch
        |> Show.owners(:delete, %Show.Owner{id: &3, owner: owner})
        |> User.shows(:delete, %User.Show{id: owner, show: &3})
      end)

    get_batch = fn handle, owners ->
      Batch.new()
      |> Registry.handle(:delete, handle)
      |> Show.profile(:delete, %Show.Profile{id: handle.id})
      |> Channel.shows(:delete, %Channel.Show{id: handle.scope, show: handle.id})
      |> delete_owners.(owners, handle.id)
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.ScopedHandle.from_keywords(show: {scope, handle}),
         :ok <- Auth.owns?(conn, Show, handle.id),
         {:ok, owners} <- Show.owners(:select, %Show.Owner{id: handle.id}),
         {:ok, batch} <- get_batch.(handle, owners) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :channel, channel}} ->
        send_resp(conn, :not_found, "channel #{channel} not found")

      {:error, {:not_found, :show, {_, show}}} ->
        send_resp(conn, :not_found, "show #{show} not found")
    end
  end

  get "/:scope/:handle/profile" do
    with {:ok, %{id: id}} <- Registry.ScopedHandle.from_keywords(show: {scope, handle}),
         {:ok, profile} <- Show.profile(:select, %Show.Profile{id: id}),
         {:ok, resp} <- Poison.encode(profile) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, {:not_found, :channel, channel}} ->
        send_resp(conn, :not_found, "channel #{channel} not found")

      {:error, {:not_found, :show, {_, show}}} ->
        send_resp(conn, :not_found, "show #{show} not found")
    end
  end

  put "/:scope/:handle/profile" do
    profile = Show.Profile.from_binary_map(conn.params)

    with {:ok, %{id: id}} <- Registry.ScopedHandle.from_keywords(show: {scope, handle}),
         :ok <- Auth.verified?(conn),
         :ok <- Auth.owns?(conn, Channel, id),
         :ok <- Show.profile(:update, Map.put(profile, :id, id)) do
      send_resp(conn, :accepted, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :channel, channel}} ->
        send_resp(conn, :not_found, "channel #{channel} not found")

      {:error, {:not_found, :show, {_, show}}} ->
        send_resp(conn, :not_found, "show #{show} not found")
    end
  end

  post "/:scope/:handle/owner" do
    owner = conn.params["owner"]

    get_batch = fn show, owner ->
      Batch.new()
      |> Show.owners(:insert, %Show.Owner{id: show, owner: owner})
      |> User.shows(:insert, %User.Show{id: owner, show: show})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, show} <- Registry.ScopedHandle.from_keywords(show: {scope, handle}),
         :ok <- Auth.owns?(conn, Show, show.id),
         {:ok, owner} <- Registry.Handle.from_keywords(user: owner),
         {:ok, batch} <- get_batch.(show.id, owner.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:exists, :show, _}} ->
        send_resp(conn, :conflict, "user already owns show")

      {:error, {:not_found, :channel, channel}} ->
        send_resp(conn, :not_found, "channel #{channel} not found")

      {:error, {:not_found, :show, {_, show}}} ->
        send_resp(conn, :not_found, "show #{show} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  delete "/:scope/:handle/owner" do
    owner = conn.params["owner"]

    get_batch = fn show, owner ->
      Batch.new()
      |> Show.owners(:delete, %Show.Owner{id: show, owner: owner})
      |> User.shows(:delete, %User.Show{id: owner, show: show})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, show} <- Registry.ScopedHandle.from_keywords(show: {scope, handle}),
         :ok <- Auth.owns?(conn, Show, show.id),
         {:ok, owner} <- Registry.Handle.from_keywords(user: owner),
         {:ok, batch} <- get_batch.(show.id, owner.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :channel, channel}} ->
        send_resp(conn, :not_found, "channel #{channel} not found")

      {:error, {:not_found, :show, {_, show}}} ->
        send_resp(conn, :not_found, "show #{show} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
