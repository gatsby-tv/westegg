defmodule Utils do
  def cql(conn, file) do
    file
    |> File.read!()
    |> String.split(";", trim: true)
    |> Stream.map(&String.trim/1)
    |> Stream.filter(&(&1 != ""))
    |> Enum.map(&Xandra.execute!(conn, &1))
  end
end

{:ok, conn} = Xandra.start_link(nodes: ["localhost:9042"])

"./priv/cql/*.cql"
|> Path.wildcard()
|> Enum.map(&Utils.cql(conn, &1))
