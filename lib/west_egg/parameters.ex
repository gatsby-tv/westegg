defmodule WestEgg.Parameters do
  defmacro __using__(_opts) do
    quote do
      def to_params(%__MODULE__{} = obj) do
        obj
        |> Map.from_struct()
        |> Map.to_list()
        |> Stream.reject(&is_nil(elem(&1, 1)))
        |> Map.new(&{to_string(elem(&1, 0)), elem(&1, 1)})
      end

      def from_binary_map(map) do
        %__MODULE__{}
        |> Map.from_struct()
        |> Map.keys()
        |> Enum.map(&to_string/1)
        |> (&Map.take(map, &1)).()
        |> Map.new(&{String.to_atom(elem(&1, 0)), elem(&1, 1)})
        |> (&struct(__MODULE__, &1)).()
      end
    end
  end
end
