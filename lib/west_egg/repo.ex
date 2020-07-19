defmodule WestEgg.Repo do
  import WestEgg.Repo.Helpers

  defmodule NotFoundError do
    defexception message: "key could not be found in the database"
  end

  defmodule NoTypeError do
    defexception message: "bucket type not found"
  end

  defmodule UnknownObjectError do
    defexception message: "unknown riak object"
  end

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]},
    }
  end

  def start_link(opts) do
    [host: host, port: port, name: name] = opts
    {:ok, pid} = :riakc_pb_socket.start_link(to_charlist(host), port)
    Process.register(pid, name)

    {:ok, pid}
  end

  def get(pid, type, bucket, key) do
    [type, bucket, key] = Enum.map([type, bucket, key], &to_string/1)
    with {:ok, obj} <- :riakc_pb_socket.fetch_type(pid, {type, bucket}, key),
         {:ok, content} <- parse(obj)
    do
      {:ok, content}
    else
      {:error, "no_type"} -> {:error, %NoTypeError{}}
      {:error, :notfound} -> {:error, %NotFoundError{}}
      {:error, :undefined} -> {:error, %UnknownObjectError{}}
      error -> error
    end
  end
end
