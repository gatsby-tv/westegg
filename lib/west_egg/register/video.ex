defmodule WestEgg.Register.Video do
  use WestEgg.Register,
    prefix: "video",
    bucket: :videos,
    spec: [
      handle: :required,
      title: :required,
      channel: :required,
      show: :optional,
      owners: :optional,
      description: :optional,
      tags: :optional,
      channel_id: :phantom,
      show_id: :phantom
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> fetch(:owners)
    |> fetch(:channel)
    |> fetch(:show)
    |> authorize(conn)
    |> trim_tags()
    |> validate(:handle)
    |> validate(:title)
    |> validate(:description)
    |> validate(:tags)
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:owners)
    |> stage(:channel)
    |> stage(:show)
    |> stage(:users)
    |> finish(conn)
  end

  defp fetch(%{channel: channel} = params, :channel) do
    case Repo.lookup(:repo, :channel, channel) do
      {:ok, id} -> Map.put(params, :channel_id, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown channel, '#{channel}'")
      {:error, reason} -> raise reason
    end
  end

  defp fetch(%{show: nil} = params, :show), do: params
  defp fetch(%{show: ""} = params, :show), do: params

  defp fetch(%{show: show, channel: channel} = params, :show) do
    is_show_handle? = String.starts_with?(show, "/")
    is_channel_handle? = String.starts_with?(channel, "#")

    handle =
      cond do
        is_show_handle? and is_channel_handle? ->
          "#{channel}#{show}"

        is_show_handle? ->
          case Repo.fetch(:repo, :channels, channel, :profile) do
            {:ok, %{"handle" => channel_handle}} -> "#{channel_handle}#{show}"
            {:error, reason} -> raise reason
          end

        true ->
          show
      end

    case Repo.lookup(:repo, :show, handle) do
      {:ok, id} -> Map.put(params, :show_id, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown show, '#{show}'")
      {:error, reason} -> raise reason
    end
  end

  defp trim_tags(%{tags: tags} = params) do
    Map.put(params, :tags, Enum.map(tags, &String.trim/1))
  end

  defp validate(%{handle: handle} = params, :handle) do
    case Validate.handle(:video, handle) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp validate(%{title: title} = params, :title) do
    case Validate.title(:video, title) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp validate(%{description: nil} = params, :description), do: params

  defp validate(%{description: description} = params, :description) do
    case Validate.description(:video, description) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp validate(%{tags: nil} = params, :tags), do: params

  defp validate(%{tags: tags} = params, :tags) do
    case Validate.tags(:video, tags) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp authorize(%{channel_id: channel, show_id: show} = params, conn) do
    cond do
      not Auth.verified?(conn) ->
        raise Auth.AuthorizationError

      not Auth.owns?(conn, channel: channel) ->
        cond do
          show in [nil, ""] -> raise Auth.AuthorizationError
          not Auth.owns?(conn, show: show) -> raise Auth.AuthorizationError
          true -> params
        end

      true ->
        params
    end
  end

  defp stage(params, :profile) do
    %{
      id: id,
      handle: handle,
      title: title,
      channel_id: channel,
      show_id: show,
      description: description,
      tags: tags
    } = params

    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "handle" => Repo.set(handle),
      "title" => Repo.set(title),
      "channel" => Repo.set(channel),
      "show" => Repo.set?(show),
      "description" => Repo.set?(description),
      "tags" => Repo.add_elements?(tags),
      "creation_time" => Repo.set(now)
    }

    Repo.modify(:repo, :videos, id, :profile, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :owners) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "owners" => Repo.add_elements(owners)
    }

    Repo.modify(:repo, :videos, id, :owners, methods)
    params
  end

  defp stage(%{id: id, channel_id: channel} = params, :channel) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "videos" => Repo.add_element(id)
    }

    Repo.modify(:repo, :channels, channel, :videos, methods)
    params
  end

  defp stage(%{show_id: nil} = params, :show), do: params
  defp stage(%{show_id: ""} = params, :show), do: params

  defp stage(%{id: id, show_id: show} = params, :show) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "videos" => Repo.add_element(id)
    }

    Repo.modify(:repo, :shows, show, :videos, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :users) do
    for owner <- owners do
      methods = %{
        "_type" => Repo.set("application/riak_set"),
        "videos" => Repo.add_element(id)
      }

      Repo.modify(:repo, :users, owner, :videos, methods)
    end

    params
  end
end
