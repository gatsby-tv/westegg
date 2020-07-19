defmodule WestEgg.Repo.Helpers do
  def parse(obj) do
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
  defp do_parse(_, value), do: value

  def add_element(binary), do: {:set, &:riakc_set.add_element(binary, &1)}

  def add_elements(binaries), do: {:set, &:riakc_set.add_elements(binaries, &1)}

  def del_element(binary), do: {:set, &:riakc_set.del_element(binary, &1)}

  def enable, do: {:flag, &:riakc_flag.enable(&1)}

  def disable, do: {:flag, &:riakc_flag.disable(&1)}

  def increment(amount), do: {:counter, &:riakc_counter.increment(amount, &1)}
  def increment, do: {:counter, &:riakc_counter.increment(&1)}

  def decrement(amount), do: {:counter, &:riakc_counter.decrement(amount, &1)}
  def decrement, do: {:counter, &:riakc_counter.decrement(&1)}

  def set(binary), do: {:register, &:riakc_register.set(binary, &1)}

  def update(methods), do: {:map, &update(&1, methods)}

  def update(obj, methods) do
    transform =
      fn {key, {type, method}}, acc ->
        :riakc_map.update({key, type}, method, acc)
      end

    methods
    |> Map.to_list()
    |> Enum.reduce(obj, transform)
  end
end
