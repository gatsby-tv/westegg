defmodule WestEgg.Routers.Videos do
  use Plug.Router
  alias WestEgg.{Auth, Batch, Channel, Error, Registry, Show, User, Video}

  plug :match
  plug :dispatch

  post "/:handle" do
    session = get_session(conn, "id")

    get_owners = fn ->
      [session | Map.get(conn.body_params, "owners", [])]
      |> Keyword.new(&{:user, &1})
      |> Registry.Handle.from_keywords()
    end

    get_channel = fn %{channel: channel} = profile when not is_nil(channel) ->
      case Registry.Handle.from_keywords(channel: channel) do
        {:ok, %{id: id}} -> Map.put(profile, :channel, id)
        {:error, reason} -> raise Error, reason: reason
      end
    end

    get_show = fn
      %{show: nil} = profile ->
        profile

      %{show: show} = profile ->
        case Registry.Handle.from_keywords(show: show) do
          {:ok, %{id: id}} -> Map.put(profile, :show, id)
          {:error, reason} -> raise Error, reason: reason
        end
    end

    get_batch = fn handle, owners ->
      profile =
        conn.params
        |> Video.Profile.from_binary_map()
        |> Map.put(:id, handle.id)
        |> get_channel.()
        |> get_show.()

      insert_owners =
        &Enum.reduce(&2, &1, fn owner, batch ->
          batch
          |> Video.owners(:insert, %Video.Owner{id: handle.id, owner: owner.id})
          |> User.videos(:insert, %User.Video{id: owner.id, video: handle.id})
        end)

      insert_channel = fn batch, channel when not is_nil(channel) ->
        case Registry.Handle.from_keywords(channel: channel) do
          {:ok, channel} ->
            Channel.videos(batch, :insert, %Channel.Video{id: channel.id, video: handle.id})

          {:error, reason} ->
            raise Error, reason: reason
        end
      end

      insert_show = fn
        batch, _, nil ->
          batch

        batch, channel, show ->
          case Registry.ScopedHandle.from_keywords(show: {channel, show}) do
            {:ok, show} ->
              Show.videos(batch, :insert, %Show.Video{id: show.id, video: handle.id})

            {:error, reason} ->
              raise Error, reason: reason
          end
      end

      Batch.new()
      |> Registry.handle(:insert, handle)
      |> Video.profile(:insert, profile)
      |> insert_channel.(profile.channel)
      |> insert_show.(profile.channel, profile.show)
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
      {:error, reason} -> raise Error, reason: reason
    end
  end

  delete "/:handle" do
    delete_owners =
      &Enum.reduce(&2, &1, fn %{"owner" => owner}, batch ->
        batch
        |> Video.owners(:delete, %Video.Owner{id: &3, owner: owner})
        |> User.videos(:delete, %User.Video{id: owner, video: &3})
      end)

    delete_channel = fn batch, channel, id ->
      Channel.videos(batch, :delete, %Channel.Video{id: channel, video: id})
    end

    delete_show = fn
      batch, nil, _id ->
        batch

      batch, show, id ->
        Show.videos(batch, :delete, %Show.Video{id: show, video: id})
    end

    get_batch = fn handle, profile, owners ->
      Batch.new()
      |> Registry.handle(:delete, handle)
      |> Video.profile(:delete, %Video.Profile{id: handle.id})
      |> delete_owners.(owners, handle.id)
      |> delete_channel.(profile.channel, handle.id)
      |> delete_show.(profile.show, handle.id)
      |> Batch.compile()
    end

    with :ok <- Auth.verified?(conn),
         {:ok, handle} <- Registry.Handle.from_keywords(video: handle),
         :ok <- Auth.owns?(conn, Video, handle.id),
         {:ok, profile} <- Video.profile(:select, %Video.Profile{id: handle.id}),
         {:ok, owners} <- Video.owners(:select, %Video.Owner{id: handle.id}),
         {:ok, batch} <- get_batch.(handle, profile, owners) do
      Xandra.execute!(:xandra, batch)
      send_resp(conn, :ok, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
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
      {:error, reason} -> raise Error, reason: reason
    end
  end

  put "/:handle/profile" do
    get_show = fn
      %{show: nil} = profile ->
        {:ok, profile}

      %{id: id, show: show} = profile ->
        with {:ok, %{channel: channel}} <- Video.profile(:select, %Video.Profile{id: id}),
             {:ok, %{id: show}} <- Registry.ScopedHandle.from_keywords(show: {channel, show}) do
          {:ok, Map.put(profile, :show, show)}
        else
          error -> error
        end
    end

    get_profile = fn id ->
      conn.params
      |> Video.Profile.from_binary_map()
      |> Map.put(:id, id)
      |> get_show.()
    end

    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(video: handle),
         :ok <- Auth.verified?(conn),
         :ok <- Auth.owns?(conn, Video, id),
         {:ok, profile} <- get_profile.(id),
         :ok <- Video.profile(:update, profile) do
      send_resp(conn, :accepted, "ok")
    else
      {:error, reason} -> raise Error, reason: reason
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
      {:error, reason} -> raise Error, reason: reason
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
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/owners" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(video: handle),
         {:ok, page} <- Video.Owner.page(%Video.Owner{id: id}, conn.params),
         {:ok, resp} <- Poison.encode(page) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, resp)
    else
      {:error, reason} -> raise Error, reason: reason
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
      {:error, reason} -> raise Error, reason: reason
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
      {:error, reason} -> raise Error, reason: reason
    end
  end

  get "/:handle/promoters" do
    with {:ok, %{id: id}} <- Registry.Handle.from_keywords(video: handle),
         {:ok, page} <- Video.Promoter.page(%Video.Promoter{id: id}, conn.params),
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
