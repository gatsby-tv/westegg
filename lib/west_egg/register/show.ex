defmodule WestEgg.Register.Show do
  use WestEgg.Register,
    prefix: "show",
    bucket: :shows,
    spec: [
      handle: :required,
      channel: :required,
      owners: :optional,
      channel_id: :phantom
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> fetch(:owners)
    |> fetch(:channel)
    |> authorize(conn)
    |> validate(:handle)
    |> convert_handle()
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:channel)
    |> stage(:owners)
    |> finish(conn)
  end

  defp fetch(%{channel: channel} = params, :channel) do
    case Repo.lookup(:repo, :channel, channel) do
      {:ok, id} -> Map.put(params, :channel_id, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown channel, '#{channel}'")
      {:error, reason} -> raise reason
    end
  end

  defp validate(%{handle: handle, channel: channel} = params, :handle) do
    case Repo.fetch(:repo, :registry, :shows, "#{channel}#{handle}") do
      {:ok, %{"in_use?" => true}} ->
        fail("show already exists")

      {:ok, _} ->
        params

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> fail("empty handle")
          String.length(handle) > 25 -> fail("handle is too long")
          not String.match?(handle, ~r/^\/[[:alnum:]\-]+$/) -> fail("malformed handle")
          true -> params
        end

      {:error, reason} ->
        raise reason
    end
  end

  defp convert_handle(%{handle: handle, channel: channel} = params),
    do: Map.put(params, :handle, "#{channel}#{handle}")

  defp authorize(%{channel_id: channel} = params, conn) do
    cond do
      not Auth.verified?(conn) -> raise Auth.AuthorizationError
      not Auth.owns?(conn, channel: channel) -> raise Auth.AuthorizationError
      true -> params
    end
  end

  defp stage(%{id: id, handle: handle, channel_id: channel, owners: owners} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "handle" => Repo.set(handle),
      "channel" => Repo.set(channel),
      "owners" => Repo.add_elements(owners),
      "creation_time" => Repo.set(now)
    }

    Repo.modify(:repo, :shows, id, :profile, methods)
    params
  end

  defp stage(%{id: id, channel_id: channel} = params, :channel) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "shows" => Repo.add_element(id)
    }
    Repo.modify(:repo, :channels, channel, :shows, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :owners) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "shows" => Repo.add_element(id)
    }

    for owner <- owners do
      Repo.modify(:repo, :users, owner, :shows, methods)
    end

    params
  end
end
