defmodule WestEgg.Registry do
  @sigils %{
    user: "@",
    channel: "#",
    show: "/",
    video: "$"
  }

  @registry_types Map.keys(@sigils)

  defmodule Handle do
    import WestEgg.Query

    query :insert, """
    INSERT INTO registry.handles (handle, id, in_use)
    VALUES (:handle, uuid(), true)
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
  end

  defmodule ScopedHandle do
    import WestEgg.Query

    query :insert, """
    INSERT INTO registry.scoped_handles (scope, handle, id, in_use)
    VALUES (:scope, :handle, uuid(), true)
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

  def new(type, {scope, handle}) when type in @registry_types do
    case validate(type, {scope, handle}) do
      :ok ->
        Xandra.execute!(:xandra, ScopedHandle.query(:insert), %{
          "scope" => scope,
          "handle" => handle
        })

        {:ok, id} = id({scope, handle})

        Xandra.execute!(:xandra, HandleById.query(:update_with_scope), %{
          "id" => id,
          "scope" => scope,
          "handle" => handle
        })

        {:ok, id}

      error ->
        error
    end
  end

  def new(type, handle) when type in @registry_types do
    case validate(type, handle) do
      :ok ->
        Xandra.execute!(:xandra, Handle.query(:insert), %{"handle" => handle})
        {:ok, id} = id(handle)
        Xandra.execute!(:xandra, HandleById.query(:update), %{"id" => id, "handle" => handle})
        {:ok, id}

      error ->
        error
    end
  end

  def switch(type, scope, current, new) when type in @registry_types do
    with :ok <- validate(type, {scope, new}),
         {:ok, id} <- id({scope, current}) do
      batch =
        Xandra.Batch.new()
        |> Xandra.Batch.add(Alias.query(:update), %{"id" => id, "handle" => current})
        |> Xandra.Batch.add(AliasByScopedHandle.query(:update), %{
          "id" => id,
          "scope" => scope,
          "handle" => current
        })
        |> Xandra.Batch.add(ScopedHandle.query(:update_used), %{
          "scope" => scope,
          "handle" => current
        })
        |> Xandra.Batch.add(ScopedHandle.query(:update), %{
          "id" => id,
          "scope" => scope,
          "handle" => new
        })
        |> Xandra.Batch.add(HandleById.query(:update_with_scope), %{
          "id" => id,
          "scope" => scope,
          "handle" => new
        })

      Xandra.execute!(:xandra, batch)
      :ok
    else
      error -> error
    end
  end

  def switch(type, current, new) when type in @registry_types do
    with :ok <- validate(type, new),
         {:ok, id} <- id(current) do
      batch =
        Xandra.Batch.new()
        |> Xandra.Batch.add(Alias.query(:update), %{"id" => id, "handle" => current})
        |> Xandra.Batch.add(AliasByHandle.query(:update), %{"id" => id, "handle" => current})
        |> Xandra.Batch.add(Handle.query(:update_used), %{"handle" => current})
        |> Xandra.Batch.add(Handle.query(:update), %{"id" => id, "handle" => new})
        |> Xandra.Batch.add(HandleById.query(:update), %{"id" => id, "handle" => new})

      Xandra.execute!(:xandra, batch)
      :ok
    else
      error -> error
    end
  end

  def validate(type, {scope, handle})
      when type in @registry_types and "" in [scope, handle],
      do: {:error, :empty}

  def validate(type, {scope, handle}) do
    select =
      Xandra.execute!(
        :xandra,
        ScopedHandle.query(:select),
        %{"scope" => scope, "handle" => handle}
      )

    case Enum.fetch(select, 0) do
      {:ok, %{"in_use" => true}} -> {:error, :in_use}
      {:ok, _} -> do_validate(type, handle)
      :error -> do_validate(type, handle)
    end
  end

  def validate(type, "") when type in @registry_types, do: {:error, :empty}

  def validate(type, handle) when type in @registry_types do
    select = Xandra.execute!(:xandra, Handle.query(:select), %{"handle" => handle})

    case Enum.fetch(select, 0) do
      {:ok, %{"in_use" => true}} -> {:error, :in_use}
      {:ok, _} -> do_validate(type, handle)
      :error -> do_validate(type, handle)
    end
  end

  defp do_validate(type, handle) do
    cond do
      not String.match?(handle, ~r/^#{Map.fetch!(@sigils, type)}[[:alnum:]_]+$/) ->
        {:error, :malformed}

      String.length(handle) > 25 ->
        {:error, :too_long}

      true ->
        :ok
    end
  end

  def delete({scope, handle}) when "" in [scope, handle], do: {:error, :empty}

  def delete({scope, handle}) do
    with {:ok, id} <- id({scope, handle}),
         {:ok, handle} <- handle({scope, handle}) do
      handle =
        case handle do
          {_, handle} -> handle
          handle -> handle
        end

      batch =
        Xandra.Batch.new()
        |> Xandra.Batch.add(ScopedHandle.query(:update_used), %{
          "scope" => scope,
          "handle" => handle
        })
        |> Xandra.Batch.add(HandleById.query(:delete), %{"id" => id})

      Xandra.execute!(:xandra, batch)
      :ok
    else
      error -> error
    end
  end

  def delete(""), do: {:error, :empty}

  def delete(handle) do
    with {:ok, id} <- id(handle),
         {:ok, handle} <- handle(handle) do
      handle =
        case handle do
          {_, _handle} -> :unexpected_scope
          handle -> handle
        end

      batch =
        Xandra.Batch.new()
        |> Xandra.Batch.add(Handle.query(:update_used), %{"handle" => handle})
        |> Xandra.Batch.add(HandleById.query(:delete), %{"id" => id})

      Xandra.execute!(:xandra, batch)
      :ok
    else
      error -> error
    end
  end

  def id({scope, handle}) when "" in [scope, handle], do: {:error, :empty}

  def id({scope, handle}) do
    cond do
      String.starts_with?(handle, Map.values(@sigils)) ->
        select =
          Xandra.execute!(:xandra, ScopedHandle.query(:select), %{
            "scope" => scope,
            "handle" => handle
          })

        case Enum.fetch(select, 0) do
          {:ok, %{"id" => id}} -> {:ok, id}
          _ -> {:error, :not_found}
        end

      true ->
        select = Xandra.execute!(:xandra, HandleById.query(:select), %{"id" => handle})

        case Enum.fetch(select, 0) do
          {:ok, _} -> {:ok, handle}
          _ -> {:error, :not_found}
        end
    end
  end

  def id(""), do: {:error, :empty}

  def id(handle) do
    cond do
      String.starts_with?(handle, Map.values(@sigils)) ->
        select = Xandra.execute!(:xandra, Handle.query(:select), %{"handle" => handle})

        case Enum.fetch(select, 0) do
          {:ok, %{"id" => id}} -> {:ok, id}
          _ -> {:error, :not_found}
        end

      true ->
        select = Xandra.execute!(:xandra, HandleById.query(:select), %{"id" => handle})

        case Enum.fetch(select, 0) do
          {:ok, _} -> {:ok, handle}
          _ -> {:error, :not_found}
        end
    end
  end

  def handle({scope, id}) when "" in [scope, id], do: {:error, :empty}

  def handle({scope, id}) do
    cond do
      String.starts_with?(id, Map.values(@sigils)) ->
        select =
          Xandra.execute!(:xandra, ScopedHandle.query(:select), %{
            "scope" => scope,
            "handle" => id
          })

        case Enum.fetch(select, 0) do
          {:ok, _} -> {:ok, {scope, id}}
          _ -> {:error, :not_found}
        end

      true ->
        select = Xandra.execute!(:xandra, HandleById.query(:select), %{"id" => id})

        case Enum.fetch(select, 0) do
          {:ok, %{"scope" => scope, "handle" => handle}} when not is_nil(scope) ->
            {:ok, {scope, handle}}

          {:ok, %{"handle" => handle}} ->
            {:ok, handle}

          _ ->
            {:error, :not_found}
        end
    end
  end

  def handle(""), do: {:error, :empty}

  def handle(id) do
    cond do
      String.starts_with?(id, Map.values(@sigils)) ->
        select = Xandra.execute!(:xandra, Handle.query(:select), %{"handle" => id})

        case Enum.fetch(select, 0) do
          {:ok, _} -> {:ok, id}
          _ -> {:error, :not_found}
        end

      true ->
        select = Xandra.execute!(:xandra, HandleById.query(:select), %{"id" => id})

        case Enum.fetch(select, 0) do
          {:ok, %{"scope" => scope, "handle" => handle}} when not is_nil(scope) ->
            {:ok, {scope, handle}}

          {:ok, %{"handle" => handle}} ->
            {:ok, handle}

          _ ->
            {:error, :not_found}
        end
    end
  end

  def aliases(""), do: {:error, :empty}

  def aliases(id) do
    case id(id) do
      {:ok, id} -> Xandra.execute!(:xandra, Alias.query(:select), %{"id" => id})
      error -> error
    end
  end

  def history({scope, handle}) when "" in [scope, handle], do: {:error, :empty}

  def history(""), do: {:error, :empty}

  def history(handle) do
    case handle(handle) do
      {:ok, {scope, handle}} ->
        result =
          Xandra.execute!(
            :xandra,
            AliasByScopedHandle.query(:select),
            %{"scope" => scope, "handle" => handle}
          )

        {:ok, result}

      {:ok, handle} ->
        result = Xandra.execute!(:xandra, AliasByHandle.query(:select), %{"handle" => handle})
        {:ok, result}

      error ->
        error
    end
  end
end
