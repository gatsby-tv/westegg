defmodule WestEgg.Repo do
  defmodule NotFoundError do
    defexception message: "key could not be found"
  end

  defmodule UnknownObjectError do
    defexception message: "unknown riak object"
  end

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]}
    }
  end

  def start_link(opts) do
    {[host: host, port: port], opts} = Keyword.split(opts, [:host, :port])
    {:ok, pid} = :riakc_pb_socket.start_link(to_charlist(host), port)

    with {:ok, name} <- Keyword.fetch(opts, :name) do
      Process.register(pid, name)
    end

    {:ok, pid}
  end

  def lookup(pid, type, handle) do
    cond do
      not String.starts_with?(handle, "#{type}_") ->
        case fetch(pid, :registry, "#{type}s", handle) do
          {:ok, %{"id" => id}} -> {:ok, id}
          error -> error
        end

      true ->
        case fetch(pid, "#{type}s", handle, :profile) do
          {:ok, _} -> {:ok, handle}
          error -> error
        end
    end
  end

  def fetch(pid, type, bucket, key) do
    [type, bucket, key] = Enum.map([type, bucket, key], &format_key/1)

    with {:ok, obj} <- :riakc_pb_socket.fetch_type(pid, {type, bucket}, key),
         {:ok, content} <- parse(obj) do
      {:ok, content}
    else
      {:error, :notfound} -> {:error, %NotFoundError{}}
      {:error, {:notfound, _}} -> {:error, %NotFoundError{}}
      {:error, :undefined} -> {:error, %UnknownObjectError{}}
      error -> error
    end
  end

  def drop(pid, type, bucket, key) do
    [type, bucket, key] = Enum.map([type, bucket, key], &format_key/1)

    case :riakc_pb_socket.delete(pid, {type, bucket}, key) do
      :ok -> :ok
      {:error, reason} -> raise reason
    end
  end

  def modify(pid, type, bucket, key, methods) do
    [type, bucket, key] = Enum.map([type, bucket, key], &format_key/1)
    modify_fn = fn map -> update(map, methods) end

    case :riakc_pb_socket.modify_type(pid, modify_fn, {type, bucket}, key, [:create]) do
      :ok -> :ok
      {:error, :unmodified} -> :unmodified
      {:error, reason} -> raise reason
    end
  end

  defp format_key(key), do: key |> to_string() |> String.trim() |> String.downcase()

  defp parse(obj) do
    cond do
      :riakc_map.is_type(obj) -> {:ok, do_parse(:map, :riakc_map.value(obj))}
      :riakc_set.is_type(obj) -> {:ok, do_parse(:set, :riakc_set.value(obj))}
      :riakc_flag.is_type(obj) -> {:ok, do_parse(:flag, :riakc_flag.value(obj))}
      :riakc_counter.is_type(obj) -> {:ok, do_parse(:counter, :riakc_counter.value(obj))}
      :riakc_register.is_type(obj) -> {:ok, do_parse(:register, :riakc_register.value(obj))}
      true -> {:error, :undefined}
    end
  end

  defp do_parse(:map, keypairs),
    do: Map.new(keypairs, fn {{key, type}, value} -> {key, do_parse(type, value)} end)

  defp do_parse(:register, value) do
    case Integer.parse(value) do
      {integer, _} -> integer
      :error -> value
    end
  end

  defp do_parse(_, value), do: value

  def add_element(binary), do: {:set, &:riakc_set.add_element(binary, &1)}

  def add_element?(empty) when empty in [nil, ""], do: {:set, &Function.identity/1}
  def add_element?(binary), do: add_element(binary)

  def add_elements(binaries), do: {:set, &:riakc_set.add_elements(binaries, &1)}

  def add_elements?(empty) when empty in [nil, []], do: {:set, &Function.identity/1}
  def add_elements?(binaries), do: add_elements(binaries)

  def del_element(binary), do: {:set, &:riakc_set.del_element(binary, &1)}

  def del_element?(empty) when empty in [nil, ""], do: {:set, &Function.identity/1}
  def del_element?(binary), do: del_element(binary)

  def enable, do: {:flag, &:riakc_flag.enable(&1)}

  def disable, do: {:flag, &:riakc_flag.disable(&1)}

  def increment(amount), do: {:counter, &:riakc_counter.increment(amount, &1)}
  def increment, do: {:counter, &:riakc_counter.increment(&1)}

  def decrement(amount), do: {:counter, &:riakc_counter.decrement(amount, &1)}
  def decrement, do: {:counter, &:riakc_counter.decrement(&1)}

  def set(binary), do: {:register, &:riakc_register.set(binary, &1)}

  def set?(empty) when empty in [nil, ""], do: {:register, &Function.identity/1}
  def set?(binary), do: set(binary)

  def update(methods), do: {:map, &update(&1, methods)}

  def update?(empty) when empty in [nil, %{}], do: {:map, &Function.identity/1}
  def update?(methods), do: update(methods)

  defp update(obj, methods) do
    transform = fn {key, {type, method}}, acc ->
      :riakc_map.update({key, type}, method, acc)
    end

    methods
    |> Map.to_list()
    |> Enum.reduce(obj, transform)
  end
end
