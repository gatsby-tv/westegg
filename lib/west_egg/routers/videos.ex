defmodule WestEgg.Routers.Videos do
  use Plug.Router
  alias WestEgg.{Auth, Batch, Registry, User, Video}

  plug :match
  plug :dispatch

  post "/:handle" do
    session = get_session(conn, "id")

    get_owners = fn ->
      [session | Map.get(conn.body_params, "owners", [])]
      |> Keyword.new(&{:user, &1})
      |> Registry.Handle.from_keywords()
    end

    get_batch = fn handle, owners ->
      profile =
        conn.params
        |> Video.Profile.from_binary_map()
        |> Map.merge(Map.from_struct(handle))

      insert_owners =
        &Enum.reduce(&2, &1, fn owner, batch ->
          batch
          |> Video.owners(:insert, %Video.Owner{id: handle.id, owner: owner.id})
          |> User.videos(:insert, %User.Video{id: owner.id, video: handle.id})
        end)

      Batch.new()
      |> Registry.handle(:insert, handle)
      |> Video.profile(:insert, profile)
      |> insert_owners.(owners)
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.Handle.new(:video, handle),
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
    end
  end

  delete "/:handle" do
    delete_owners =
      &Enum.reduce(&2, &1, fn %{"owner" => owner}, batch ->
        batch
        |> Video.owners(:delete, %Video.Owner{id: &3, owner: owner})
        |> User.videos(:delete, %User.Video{id: owner, video: &3})
      end)

    get_batch = fn handle, owners ->
      Batch.new()
      |> Registry.handle(:delete, handle)
      |> Video.profile(:delete, %Video.Profile{id: handle.id})
      |> delete_owners.(owners, handle.id)
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.Handle.from_keywords(video: handle),
         :ok <- Auth.owns?(conn, Video, handle.id),
         {:ok, owners} <- Video.owners(:select, %Video.Owner{id: handle.id}),
         {:ok, batch} <- get_batch.(handle, owners) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")
    end
  end

  get "/:handle/profile" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(video: handle),
         {:ok, profile} <- Video.profile(:select, %Video.Profile{id: id}),
         {:ok, resp} <- Poison.encode(profile) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")
    end
  end

  put "/:handle/profile" do
    profile = Video.Profile.from_binary_map(conn.params)

    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(video: handle),
         :ok <- Auth.verified?(conn),
         :ok <- Auth.owns?(conn, Video, id),
         :ok <- Video.profile(:update, Map.put(profile, :id, id)) do
      send_resp(conn, :accepted, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")
    end
  end

  post "/:handle/owner" do
    owner = conn.params["owner"]

    get_batch = fn video, owner ->
      Batch.new()
      |> Video.owners(:insert, %Video.Owner{id: video, owner: owner})
      |> User.videos(:insert, %User.Video{id: owner, video: video})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [video, owner]} <- Registry.Handle.from_keywords(video: handle, user: owner),
         :ok <- Auth.owns?(conn, Video, video.id),
         {:ok, batch} <- get_batch.(video.id, owner.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:exists, :video, _}} ->
        send_resp(conn, :conflict, "user already owns video")

      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  delete "/:handle/owner" do
    owner = conn.params["owner"]

    get_batch = fn video, owner ->
      Batch.new()
      |> Video.owners(:delete, %Video.Owner{id: video, owner: owner})
      |> User.videos(:delete, %User.Video{id: owner, video: video})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [video, owner]} <- Registry.Handle.from_keywords(video: handle, user: owner),
         :ok <- Auth.owns?(conn, Video, video.id),
         {:ok, batch} <- get_batch.(video.id, owner.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "unauthorized")

      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  post "/:handle/promoter" do
    session = get_session(conn, "id")

    get_batch = fn video, user ->
      Batch.new()
      |> Video.promoters(:insert, %Video.Promoter{id: video, promoter: user})
      |> User.promotions(:insert, %User.Promotion{id: user, promotion: video})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [video, user]} <- Registry.Handle.from_keywords(video: handle, user: session),
         {:ok, batch} <- get_batch.(video.id, user.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "session not verified")

      {:error, {:exists, :promoter, _}} ->
        send_resp(conn, :conflict, "promoter already exists")

      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end

  delete "/:handle/promoter" do
    session = get_session(conn, "id")

    get_batch = fn video, user ->
      Batch.new()
      |> Video.promoters(:delete, %Video.Promoter{id: video, promoter: user})
      |> User.promotions(:delete, %User.Promotion{id: user, promotion: video})
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, [video, user]} <- Registry.Handle.from_keywords(video: handle, user: session),
         {:ok, batch} <- get_batch.(video.id, user.id) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :created, "ok")
    else
      {:error, :unauthorized} ->
        send_resp(conn, :unauthorized, "session not verified")

      {:error, {:not_found, :video, video}} ->
        send_resp(conn, :not_found, "video #{video} not found")

      {:error, {:not_found, :user, user}} ->
        send_resp(conn, :not_found, "user #{user} not found")
    end
  end
end
