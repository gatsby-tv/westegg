defmodule WestEgg.Registry do
  defmodule Handle do
    defstruct [:handle, :id, :in_use]

    use WestEgg.Parameters
    import WestEgg.Query
    alias WestEgg.Registry

    @sigils %{
      user: "@",
      channel: "#",
      video: "$"
    }

    query :insert, """
    INSERT INTO registry.handles (handle, id, in_use)
    VALUES (:handle, :id, true)
    """

    query :select, """
    SELECT * FROM registry.handles
    WHERE handle = :handle
    """

    query :update, """
    UPDATE registry.handles
    SET id = :id,
        in_use = true
    WHERE handle = :handle
    """

    query :update_used, """
    UPDATE registry.handles
    SET in_use = false
    WHERE handle = :handle
    """

    def new(type, handle) do
      cond do
        String.length(handle) > 25 ->
          {:error, {:too_long, :handle, handle}}

        not String.match?(handle, ~r/^[[:alnum:]_]+$/) ->
          {:error, {:malformed, :handle, handle}}

        true ->
          {:ok, %__MODULE__{id: UUID.uuid4(), handle: "#{@sigils[type]}#{handle}"}}
      end
    end

    def from_keywords(handles) do
      result =
        Enum.reduce_while(handles, {:ok, []}, fn {type, handle}, {:ok, acc} ->
          case fetch(type, handle) do
            {:ok, new} -> {:cont, {:ok, [new | acc]}}
            {:error, reason} -> {:halt, {:error, {reason, type, handle}}}
          end
        end)

      case result do
        {:ok, [handle | []]} -> {:ok, handle}
        {:ok, list} -> {:ok, Enum.reverse(list)}
        error -> error
      end
    end

    defp fetch(type, handle) do
      handle =
        cond do
          String.length(handle) > 25 -> %__MODULE__{id: handle}
          true -> %__MODULE__{handle: "#{@sigils[type]}#{handle}"}
        end

      Registry.handle(:select, handle)
    end
  end

  defmodule ScopedHandle do
    defstruct [:scope, :handle, :id, :in_use]

    use WestEgg.Parameters
    import WestEgg.Query
    alias WestEgg.Registry

    @sigils %{
      show: "/"
    }

    @scopes %{
      show: :channel
    }

    query :insert, """
    INSERT INTO registry.scoped_handles (scope, handle, id, in_use)
    VALUES (:scope, :handle, :id, true)
    """

    query :select, """
    SELECT * FROM registry.scoped_handles
    WHERE scope = :scope
    AND handle = :handle
    """

    query :update, """
    UPDATE registry.scoped_handles
    SET id = :id,
        in_use = true
    WHERE scope = :scope
    AND handle = :handle
    """

    query :update_used, """
    UPDATE registry.scoped_handles
    SET in_use = false
    WHERE scope = :scope
    AND handle = :handle
    """

    def new(type, {scope, handle}) do
      case Registry.Handle.from_keywords([{@scopes[type], scope}]) do
        {:ok, %{id: scope}} ->
          cond do
            String.length(handle) > 25 ->
              {:error, {:too_long, :handle, handle}}

            not String.match?(handle, ~r/^[[:alnum:]_]+$/) ->
              {:error, {:malformed, :handle, handle}}

            true ->
              {:ok,
               %__MODULE__{
                 id: UUID.uuid4(),
                 scope: scope,
                 handle: "#{@sigils[type]}#{handle}"
               }}
          end

        error ->
          error
      end
    end

    def from_keywords(handles) do
      result =
        Enum.reduce_while(handles, {:ok, []}, fn {type, {scope, handle}}, {:ok, acc} ->
          case fetch(type, {scope, handle}) do
            {:ok, new} -> {:cont, {:ok, [new | acc]}}
            {:error, {reason, type, handle}} -> {:halt, {:error, {reason, type, handle}}}
            {:error, reason} -> {:halt, {:error, {reason, type, handle}}}
          end
        end)

      case result do
        {:ok, [handle | []]} -> {:ok, handle}
        {:ok, list} -> {:ok, Enum.reverse(list)}
        error -> error
      end
    end

    defp fetch(type, {scope, handle}) do
      case Registry.Handle.from_keywords([{@scopes[type], scope}]) do
        {:ok, %{id: scope}} ->
          Registry.handle(:select, %__MODULE__{
            scope: scope,
            handle: "#{@sigils[type]}#{handle}"
          })

        error ->
          error
      end
    end
  end

  defmodule HandleById do
    import WestEgg.Query

    query :select, """
    SELECT * FROM registry.handles_by_id
    WHERE id = :id
    """

    query :update, """
    UPDATE registry.handles_by_id
    SET handle = :handle
    WHERE id = :id
    """

    query :update_with_scope, """
    UPDATE registry.handles_by_id
    SET scope = :scope,
        handle = :handle
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM registry.handles_by_id
    WHERE id = :id
    """
  end

  defmodule Alias do
    defstruct [:id, :scope, :handle, :since]

    use WestEgg.Parameters
    import WestEgg.Query

    query :select, """
    SELECT * FROM registry.aliases
    WHERE id = :id
    """

    query :update, """
    UPDATE registry.aliases
    SET since = toUnixTimestamp(now())
    WHERE id = :id
    AND handle = :handle
    """
  end

  defmodule AliasByHandle do
    import WestEgg.Query

    query :select, """
    SELECT * FROM registry.aliases_by_handle
    WHERE handle = :handle
    """

    query :update, """
    UPDATE registry.aliases_by_handle
    SET since = toUnixTimestamp(now())
    WHERE handle = :handle
    AND id = :id
    """
  end

  defmodule AliasByScopedHandle do
    import WestEgg.Query

    query :select, """
    SELECT * FROM registry.aliases_by_scoped_handle
    WHERE scope = :scope
    AND handle = :handle
    """

    query :update, """
    UPDATE registry.aliases_by_scoped_handle
    SET since = toUnixTimestamp(now())
    WHERE scope = :scope
    AND handle = :handle
    AND id = :id
    """
  end

  def handle(:insert, %Handle{} = handle) do
    params = Handle.to_params(handle)
    select = Xandra.execute!(:xandra, Handle.query(:insert), params)

    do_insert = fn ->
      batch =
        Xandra.Batch.new()
        |> Xandra.Batch.add(Handle.query(:insert), params)
        |> Xandra.Batch.add(HandleById.query(:update), params)

      Xandra.execute!(:xandra, batch)
      :ok
    end

    case Enum.fetch(select, 0) do
      :error -> do_insert.()
      {:ok, %{"in_use" => false}} -> do_insert.()
      {:ok, _} -> {:error, :exists}
    end
  end

  def handle(:insert, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)
    select = Xandra.execute!(:xandra, ScopedHandle.query(:insert), params)

    do_insert = fn ->
      batch =
        Xandra.Batch.new()
        |> Xandra.Batch.add(ScopedHandle.query(:insert), params)
        |> Xandra.Batch.add(HandleById.query(:update_with_scope), params)

      Xandra.execute!(:xandra, batch)
      :ok
    end

    case Enum.fetch(select, 0) do
      :error -> do_insert.()
      {:ok, %{"in_use" => false}} -> do_insert.()
      {:ok, _} -> {:error, :exists}
    end
  end

  def handle(:select, %Handle{handle: nil} = handle) do
    params = Handle.to_params(handle)
    select = Xandra.execute!(:xandra, HandleById.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Handle.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def handle(:select, %ScopedHandle{handle: nil} = handle) do
    params = ScopedHandle.to_params(handle)
    select = Xandra.execute!(:xandra, HandleById.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, ScopedHandle.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def handle(:select, %Handle{} = handle) do
    params = Handle.to_params(handle)
    select = Xandra.execute!(:xandra, Handle.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Handle.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def handle(:select, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)
    select = Xandra.execute!(:xandra, ScopedHandle.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, ScopedHandle.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def handle(:update, %Handle{} = handle) do
    params = Handle.to_params(handle)
    select = Xandra.execute!(:xandra, HandleById.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        new = Map.merge(current, params)

        batch =
          Xandra.Batch.new()
          |> Xandra.Batch.add(Alias.query(:update), current)
          |> Xandra.Batch.add(AliasByHandle.query(:update), current)
          |> Xandra.Batch.add(Handle.query(:update_used), current)
          |> Xandra.Batch.add(Handle.query(:update), new)
          |> Xandra.Batch.add(HandleById.query(:update), new)

        Xandra.execute!(:xandra, batch)
        :ok

      :error ->
        {:error, :not_found}
    end
  end

  def handle(:update, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)
    select = Xandra.execute!(:xandra, HandleById.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        new = Map.merge(current, params)

        batch =
          Xandra.Batch.new()
          |> Xandra.Batch.add(Alias.query(:update), current)
          |> Xandra.Batch.add(AliasByScopedHandle.query(:update), current)
          |> Xandra.Batch.add(ScopedHandle.query(:update_used), current)
          |> Xandra.Batch.add(ScopedHandle.query(:update), new)
          |> Xandra.Batch.add(HandleById.query(:update), new)

        Xandra.execute!(:xandra, batch)
        :ok

      :error ->
        {:error, :not_found}
    end
  end

  def handle(:delete, %Handle{} = handle) do
    params = Handle.to_params(handle)

    batch =
      Xandra.Batch.new()
      |> Xandra.Batch.add(Handle.query(:update_used), params)
      |> Xandra.Batch.add(HandleById.query(:delete), params)

    Xandra.execute!(:xandra, batch)
    :ok
  end

  def handle(:delete, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)

    batch =
      Xandra.Batch.new()
      |> Xandra.Batch.add(ScopedHandle.query(:update_used), params)
      |> Xandra.Batch.add(HandleById.query(:delete), params)

    Xandra.execute!(:xandra, batch)
    :ok
  end

  def handle([{:error, _} | _] = batch, _op, _data), do: batch

  def handle(batch, :insert, %Handle{} = handle) do
    params = Handle.to_params(handle)
    select = Xandra.execute!(:xandra, Handle.query(:select), params)

    do_insert = fn ->
      query = fn acc ->
        acc
        |> Xandra.Batch.add(Handle.query(:insert), params)
        |> Xandra.Batch.add(HandleById.query(:update), params)
      end

      [{:ok, query} | batch]
    end

    case Enum.fetch(select, 0) do
      :error -> do_insert.()
      {:ok, %{"in_use" => false}} -> do_insert.()
      {:ok, _} -> [{:error, {:exists, :handle, handle.handle}} | batch]
    end
  end

  def handle(batch, :insert, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)
    select = Xandra.execute!(:xandra, ScopedHandle.query(:select), params)

    do_insert = fn ->
      query = fn acc ->
        acc
        |> Xandra.Batch.add(ScopedHandle.query(:insert), params)
        |> Xandra.Batch.add(HandleById.query(:update_with_scope), params)
      end

      [{:ok, query} | batch]
    end

    case Enum.fetch(select, 0) do
      :error -> do_insert.()
      {:ok, %{"in_use" => false}} -> do_insert.()
      {:ok, _} -> [{:error, {:exists, :handle, handle.handle}} | batch]
    end
  end

  def handle(batch, :update, %Handle{} = handle) do
    params = Handle.to_params(handle)
    select = Xandra.execute!(:xandra, HandleById.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        new = Map.merge(current, params)

        query = fn acc ->
          acc
          |> Xandra.Batch.add(Alias.query(:update), current)
          |> Xandra.Batch.add(AliasByHandle.query(:update), current)
          |> Xandra.Batch.add(Handle.query(:update_used), current)
          |> Xandra.Batch.add(Handle.query(:update), new)
          |> Xandra.Batch.add(HandleById.query(:update), new)
        end

        [{:ok, query} | batch]

      :error ->
        [{:error, {:not_found, :handle, handle.handle}} | batch]
    end
  end

  def handle(batch, :update, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)
    select = Xandra.execute!(:xandra, HandleById.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        new = Map.merge(current, params)

        query = fn acc ->
          acc
          |> Xandra.Batch.add(Alias.query(:update), current)
          |> Xandra.Batch.add(AliasByScopedHandle.query(:update), current)
          |> Xandra.Batch.add(ScopedHandle.query(:update_used), current)
          |> Xandra.Batch.add(ScopedHandle.query(:update), new)
          |> Xandra.Batch.add(HandleById.query(:update_with_scope), new)
        end

        [{:ok, query} | batch]

      :error ->
        [{:error, {:not_found, :handle, handle.handle}} | batch]
    end
  end

  def handle(batch, :delete, %Handle{} = handle) do
    params = Handle.to_params(handle)

    query = fn acc ->
      acc
      |> Xandra.Batch.add(Handle.query(:update_used), params)
      |> Xandra.Batch.add(HandleById.query(:delete), params)
    end

    [{:ok, query} | batch]
  end

  def handle(batch, :delete, %ScopedHandle{} = handle) do
    params = ScopedHandle.to_params(handle)

    query = fn acc ->
      acc
      |> Xandra.Batch.add(ScopedHandle.query(:update_used), params)
      |> Xandra.Batch.add(HandleById.query(:delete), params)
    end

    [{:ok, query} | batch]
  end

  def aliases(:select, %Alias{id: nil, scope: nil} = alias_) do
    params = Alias.to_params(alias_)
    result = Xandra.execute!(:xandra, AliasByHandle.query(:select), params)
    {:ok, result}
  end

  def aliases(:select, %Alias{id: nil} = alias_) do
    params = Alias.to_params(alias_)
    result = Xandra.execute!(:xandra, AliasByScopedHandle.query(:select), params)
    {:ok, result}
  end

  def aliases(:select, %Alias{} = alias_) do
    params = Alias.to_params(alias_)
    result = Xandra.execute!(:xandra, Alias.query(:select), params)
    {:ok, result}
  end
end
