defmodule WestEgg.Register.Show do
  use WestEgg.Register,
    prefix: "show",
    bucket: :shows,
    spec: [
      handle: :required,
      channel: :required,
      owners: :required
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> fetch(:owners)
    |> fetch(:channel)
    |> valid?(:handle)
    |> convert_handle()
    |> authorize(conn)
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:channel)
    |> finish(conn)
  end

  defp fetch(%{owners: owners} = params, :owners) do
    fetch_owner =
      fn owner ->
        owner = String.trim(owner)
        case Repo.fetch(:repo, :registry, :users, owner) do
          {:ok, register} ->
            unless register["in_use?"], do: fail("unknown user, '#{owner}'")
            register["id"]

          {:error, %Repo.NotFoundError{}} -> fail("unknown user, '#{owner}'")
          {:error, reason} -> raise reason
        end
      end

    owners = Enum.map(owners, fetch_owner)
    if length(owners) == 0, do: fail("shows must have at least one owner")

    Map.put(params, :owners, owners)
  end

  defp fetch(%{channel: channel} = params, :channel) do
    case Repo.fetch(:repo, :registry, :channels, channel) do
      {:ok, register} ->
        unless register["in_use?"], do: fail("unknown channel, '#{channel}'")
        Map.put(params, :channel_id, register["id"])

      {:error, %Repo.NotFoundError{}} -> fail("unknown channel, '#{channel}'")
      {:error, reason} -> raise reason
    end
  end

  defp convert_handle(%{handle: handle, channel: channel} = params),
    do: Map.put(params, :handle, "#{channel}#{handle}")

  defp valid?(%{handle: handle, channel: channel} = params, :handle) do
    case Repo.fetch(:repo, :registry, :shows, "#{channel}#{handle}") do
      {:ok, %{"in_use?" => true}} -> fail("show already exists")
      {:ok, _} -> params

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> fail("empty handle")
          String.length(handle) > 25 -> fail("handle is too long")
          not String.match?(handle, ~r/^\/[[:alnum:]\-]+$/) -> fail("malformed handle")
          true -> params
        end

      {:error, reason} -> raise reason
    end
  end

  defp authorize(%{owners: owners, channel_id: channel_id} = params, conn) do
    session = get_session(conn)
    user = session["user"]
    if is_nil(user), do: raise Register.PermissionError
    unless session["verified?"], do: raise Register.PermissionError

    unless user in owners, do: raise Register.PermissionError

    {:ok, channel} = Repo.fetch(:repo, :channels, channel_id, :profile)
    unless user in channel["owners"], do: raise Register.PermissionError

    params
  end

  defp stage(%{id: id, handle: handle, channel_id: channel, owners: owners} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()
    methods = %{
      "handle" => Repo.set(handle),
      "channel" => Repo.set(channel),
      "owners" => Repo.add_elements(owners),
      "creation_time" => Repo.set(now)
    }
    Repo.modify(:repo, :shows, id, :profile, methods)
    params
  end

  defp stage(%{id: id, channel_id: channel} = params, :channel) do
    methods = %{"shows" => Repo.add_element(id)}
    Repo.modify(:repo, :channels, channel, :profile, methods)
    params
  end
end
