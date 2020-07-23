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
      tags: :optional
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> fetch(:owners)
    |> fetch(:channel)
    |> fetch(:show)
    |> valid?(:handle)
    |> valid?(:title)
    |> valid?(:description)
    |> valid?(:tags)
    |> authorize(conn)
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:channel)
    |> stage(:show)
    |> stage(:owners)
    |> finish(conn)
  end

  defp fetch(%{channel: channel} = params, :channel) do
    case Repo.fetch(:repo, :registry, :channels, channel) do
      {:ok, %{"id" => id}} -> Map.put(params, :channel_id, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown channel, '#{channel}'")
      {:error, reason} -> raise reason
    end
  end

  defp fetch(%{show: nil} = params, :show), do: params
  defp fetch(%{show: ""} = params, :show), do: params

  defp fetch(%{show: show, channel: channel} = params, :show) do
    case Repo.fetch(:repo, :registry, :shows, "#{channel}#{show}") do
      {:ok, %{"id" => id}} -> Map.put(params, :show_id, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown show, '#{show}'")
      {:error, reason} -> raise reason
    end
  end

  defp valid?(%{handle: handle} = params, :handle) do
    case Repo.fetch(:repo, :registry, :videos, handle) do
      {:ok, %{"in_use?" => true}} ->
        fail("video already exists")

      {:ok, _} ->
        params

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> fail("empty handle")
          not String.match?(handle, ~r/^\$[0-9A-HJ-NP-Za-km-z]+$/) -> fail("malformed handle")
          true -> params
        end

      {:error, reason} ->
        raise reason
    end
  end

  defp valid?(%{title: title} = params, :title) do
    cond do
      String.length(title) == 0 -> fail("empty title")
      String.length(title) > 128 -> fail("title is too long")
      true -> params
    end
  end

  defp valid?(%{description: nil} = params, :description), do: params
  defp valid?(%{description: ""} = params, :description), do: params

  defp valid?(%{description: description} = params, :description) do
    if String.length(description) > 1000, do: fail("description is too long"), else: params
  end

  defp valid?(%{tags: nil} = params, :tags), do: params
  defp valid?(%{tags: []} = params, :tags), do: params

  defp valid?(%{tags: tags} = params, :tags) do
    tags =
      for tag <- Enum.map(tags, &String.trim/1), into: [] do
        unless String.match?(tag, ~r/^[[:alnum:]\-\_][[:alnum:][:space:]\-\_]*$/),
          do: fail("malformed tag, '#{tag}'"),
          else: tag
      end

    Map.put(params, :tags, tags)
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
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "handle" => Repo.set(params.handle),
      "title" => Repo.set(params.title),
      "owners" => Repo.add_elements(params.owners),
      "channel" => Repo.set(params.channel_id),
      "show" => Repo.set?(params.show_id),
      "description" => Repo.set?(params.description),
      "tags" => Repo.add_elements?(params.tags),
      "creation_time" => Repo.set(now)
    }

    Repo.modify(:repo, :videos, params.id, :profile, methods)

    params
  end

  defp stage(%{id: id, channel_id: channel} = params, :channel) do
    methods = %{"videos" => Repo.add_element(id)}
    Repo.modify(:repo, :channels, channel, :profile, methods)
    params
  end

  defp stage(%{show_id: nil} = params, :show), do: params
  defp stage(%{show_id: ""} = params, :show), do: params

  defp stage(%{id: id, show_id: show} = params, :show) do
    methods = %{"videos" => Repo.add_element(id)}
    Repo.modify(:repo, :shows, show, :profile, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :owners) do
    for owner <- owners do
      methods = %{"videos" => Repo.add_element(id)}
      Repo.modify(:repo, :users, owner, :profile, methods)
    end

    params
  end
end
