defmodule WestEgg.Register.Channel do
  use WestEgg.Register,
    prefix: "channel",
    bucket: :channels,
    spec: [
      handle: :required,
      owners: :optional
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> fetch(:owners)
    |> validate(:handle)
    |> authorize(conn)
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:owners)
    |> finish(conn)
  end

  defp validate(%{handle: handle} = params, :handle) do
    case Repo.fetch(:repo, :registry, :channels, handle) do
      {:ok, %{"in_use?" => true}} ->
        fail("handle not available")

      {:ok, _} ->
        params

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> fail("empty handle")
          String.length(handle) > 25 -> fail("handle is too long")
          not String.match?(handle, ~r/^#[[:alnum:]\-]+$/) -> fail("malformed handle")
          true -> params
        end

      {:error, reason} ->
        raise reason
    end
  end

  defp authorize(params, conn) do
    if Auth.verified?(conn), do: params, else: raise(Auth.AuthorizationError)
  end

  defp stage(%{id: id, handle: handle, owners: owners} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "handle" => Repo.set(handle),
      "owners" => Repo.add_elements(owners),
      "creation_time" => Repo.set(now)
    }

    Repo.modify(:repo, :channels, id, :profile, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :owners) do
    for owner <- owners do
      methods = %{"channels" => Repo.add_element(id)}
      Repo.modify(:repo, :users, owner, :profile, methods)
    end

    params
  end
end
