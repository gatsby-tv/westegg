defmodule WestEgg.Batch do
  def new(), do: []

  def compile(batch, type \\ :logged) do
    batch
    |> Enum.reverse()
    |> Enum.reduce_while({:ok, Xandra.Batch.new(type)}, fn statement, {:ok, xandra} ->
      case statement do
        {:ok, query} -> {:cont, {:ok, query.(xandra)}}
        error -> {:halt, error}
      end
    end)
  end
end
