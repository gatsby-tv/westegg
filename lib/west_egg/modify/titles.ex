defmodule WestEgg.Modify.Titles do
  use WestEgg.Modify,
    spec: [
      handle: :required,
      new: :required,
      id: :phantom
    ],
    ops: [:user, :channel, :show, :video]

  @impl true
  def modify(op, conn, params, _opts) do
    params
    |> fetch(op, :handle)
    |> authorize(op, conn)
    |> validate(op, :new)
    |> stage(op, :profile)
    |> finish(conn)
  end

  defp fetch(%{handle: handle} = params, type, :handle) do
    case Repo.lookup(:repo, type, handle) do
      {:ok, id} -> Map.put(params, :id, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown handle, '#{handle}'")
      {:error, reason} -> raise reason
    end
  end

  defp authorize(%{id: id} = params, :user, conn) do
    if Auth.verified?(conn, as: id), do: params, else: raise(Auth.AuthorizationError)
  end

  defp authorize(%{id: id} = params, type, conn) do
    if Auth.owns?(conn, {type, id}), do: params, else: raise(Auth.AuthorizationError)
  end

  defp validate(%{new: new} = params, type, :new) do
    case Validate.title(type, new) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp stage(%{id: id, new: new} = params, type, :profile) do
    methods = %{"title" => Repo.set(new)}
    Repo.modify(:repo, "#{type}s", id, :profile, methods)
    params
  end
end
