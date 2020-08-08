defmodule WestEgg.Parameters do
  defmacro __using__(_opts) do
    quote do
      def to_params(%__MODULE__{} = obj) do
        obj
        |> Map.from_struct()
        |> Map.to_list()
        |> Stream.reject(fn {_, value} -> is_nil(value) end)
        |> Map.new(fn {key, value} -> {to_string(key), value} end)
      end
    end
  end
end
