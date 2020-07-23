defmodule WestEgg.Register.Show do
  use WestEgg.Register,
    prefix: "show",
    bucket: :shows,
    spec: [
      handle: :required,
      channel: :required,
      owners: :optional
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
    |> stage(:owners)
    |> finish(conn)
  end

  defp fetch(%{channel: channel} = params, :channel) do
    case Repo.fetch(:repo, :registry, :channels, channel) do
      {:ok, register} ->
        unless register["in_use?"], do: fail("unknown channel, '#{channel}'")
        Map.put(params, :channel_id, register["id"])

      {:error, %Repo.NotFoundError{}} ->
        fail("unknown channel, '#{channel}'")

      {:error, reason} ->
        raise reason
    end
  end

  defp valid?(%{handle: handle, channel: channel} = params, :handle) do
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

  defp stage(%{id: id, owners: owners} = params, :owners) do
    methods = %{"shows" => Repo.add_element(id)}

    for owner <- owners do
      Repo.modify(:repo, :users, owner, :profile, methods)
    end

    params
  end
end
