defmodule WestEgg.Registry do
  @redis_register_script """
  if not redis.call('get', KEYS[1]:lower() .. ':in_use') then
    redis.call('set', KEYS[1]:lower(), KEYS[2])
    redis.call('set', KEYS[2], KEYS[1])
    redis.call('set', KEYS[1]:lower() .. ':in_use', '1')
    return true
  else
    return redis.error_reply("Key is in use")
  end
  """

  @redis_update_script """
  if not redis.call('get', KEYS[1]:lower() .. ':in_use') then
    redis.call('set', KEYS[1]:lower(), KEYS[3])
    redis.call('set', KEYS[3], KEYS[1])
    redis.call('set', KEYS[1]:lower() .. ':in_use', '1')
    redis.call('del', KEYS[2]:lower() .. ':in_use')
    return true
  else
    return redis.error_reply("Key is in use")
  end
  """

  @sigils %{
    user: "@",
    channel: "#",
    video: "$"
  }

  def register(type, handle, id) do
    handle = String.trim(handle)

    with :ok <- validate(handle) do
      eval(:register, ["#{@sigils[type]}#{handle}", id])
    end
  end

  def lookup(target, type, key), do: do_lookup(target, type, to_charlist(key))

  defp do_lookup(:id, _type, key) when length(key) > 15 do
    key = to_string(key)

    case get(key) do
      {:ok, _} -> {:ok, key}
      error -> error
    end
  end

  defp do_lookup(:handle, type, key) when length(key) <= 15 do
    key = "#{@sigils[type]}#{key}"

    case get(key) do
      {:ok, _} -> {:ok, key}
      error -> error
    end
  end

  defp do_lookup(:id, type, key), do: get("#{@sigils[type]}#{key}")
  defp do_lookup(:handle, _type, key), do: get(to_string(key))

  def update(type, key, new) do
    new = String.trim(new)

    with {:ok, handle} <- lookup(:handle, type, key),
         {:ok, id} <- lookup(:id, type, key),
         :ok <- validate(new) do
      eval(:update, ["#{@sigils[type]}#{new}", handle, id])
    end
  end

  defp validate(handle) do
    cond do
      handle == "" -> {:error, :empty}
      String.length(handle) > 15 -> {:error, :too_long}
      not String.match?(handle, ~r/^[[:alnum:]_]+$/) -> {:error, :malformed}
      true -> :ok
    end
  end

  defp get(key) do
    case Redix.command(:redix, ["GET", String.downcase(key)]) do
      {:ok, nil} -> {:error, :not_found}
      result -> result
    end
  end

  defp eval(:register, args), do: run_script(@redis_register_script, args)
  defp eval(:update, args), do: run_script(@redis_update_script, args)

  defp run_script(script, args) do
    case Redix.command(:redix, ["EVAL", script, length(args)] ++ args) do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :in_use}
    end
  end
end
