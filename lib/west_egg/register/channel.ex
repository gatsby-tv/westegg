defmodule WestEgg.Register.Channel do
  use WestEgg.Register,
    prefix: "channel",
    bucket: :channels,
    spec: [
      handle: :required,
      owners: :required
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> fetch(:owners)
    |> valid?(:handle)
    |> authorize(conn)
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:owners)
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
    if length(owners) == 0, do: fail("channels must have at least one owner")

    Map.put(params, :owners, owners)
  end

  defp valid?(%{handle: handle} = params, :handle) do
    case Repo.fetch(:repo, :registry, :channels, handle) do
      {:ok, %{"in_use?" => true}} -> fail("channel already exists")
      {:ok, _} -> params

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> fail("empty handle")
          String.length(handle) > 25 -> fail("handle is too long")
          not String.match?(handle, ~r/^#[[:alnum:]\-]+$/) -> fail("malformed handle")
          true -> params
        end

      {:error, reason} -> raise reason
    end
  end

  defp authorize(%{owners: owners} = params, conn) do
    session = get_session(conn)
    user = session["user"]
    if is_nil(user), do: raise Register.PermissionError
    unless session["verified?"], do: Register.PermissionError

    unless user in owners, do: raise Register.PermissionError

    params
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
