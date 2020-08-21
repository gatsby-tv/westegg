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

  def execute!(batches, opts \\ [])

  def execute!(batches, opts) do
    Xandra.run(:xandra, fn conn ->
      batches
      |> List.wrap()
      |> Enum.each(&Xandra.execute!(conn, &1, opts))
    end)
  end
end
