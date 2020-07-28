defmodule WestEgg.Modify.Handles do
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
    |> stage(op, :old)
    |> stage(op, :new)
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
    case Validate.handle(type, new) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp stage(%{handle: handle} = params, type, :old) do
    methods = %{"in_use?" => Repo.disable()}
    Repo.modify(:repo, :registry, "#{type}s", handle, methods)
    params
  end

  defp stage(%{id: id, new: new} = params, type, :new) do
    methods = %{"id" => Repo.set(id), "in_use?" => Repo.enable()}
    Repo.modify(:repo, :registry, "#{type}s", new, methods)
    params
  end
end
