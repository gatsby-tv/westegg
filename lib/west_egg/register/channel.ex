defmodule WestEgg.Register.Channel do
  use WestEgg.Register,
    prefix: "channel",
    bucket: :channels,
    spec: [
      handle: :required,
      title: :required,
      owners: :optional
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> authorize(conn)
    |> fetch(:owners)
    |> validate(:handle)
    |> validate(:title)
    |> stage(:registry)
    |> stage(:profile)
    |> stage(:owners)
    |> stage(:users)
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

  defp validate(%{title: title} = params, :title) do
    cond do
      String.length(title) == 0 -> fail("empty display name")
      String.length(title) > 64 -> fail("display name is too long")
      true -> params
    end
  end

  defp authorize(params, conn) do
    if Auth.verified?(conn), do: params, else: raise(Auth.AuthorizationError)
  end

  defp stage(%{id: id, handle: handle, title: title} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "handle" => Repo.set(handle),
      "title" => Repo.set(title),
      "creation_time" => Repo.set(now)
    }

    Repo.modify(:repo, :channels, id, :profile, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :owners) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "owners" => Repo.add_elements(owners)
    }

    Repo.modify(:repo, :channels, id, :owners, methods)
    params
  end

  defp stage(%{id: id, owners: owners} = params, :users) do
    for owner <- owners do
      methods = %{
        "_type" => Repo.set("application/riak_set"),
        "channels" => Repo.add_element(id)
      }

      Repo.modify(:repo, :users, owner, :channels, methods)
    end

    params
  end
end
