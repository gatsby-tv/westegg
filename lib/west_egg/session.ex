defmodule WestEgg.Session do
  @behaviour Plug.Session.Store

  defmodule Login do
    import WestEgg.Query

    query :update, """
    UPDATE sessions.logins USING :ttl
    SET id = :id,
        is_verified = :is_verified
    WHERE session = :session
    """

    query :select, """
    SELECT * FROM sessions.logins
    WHERE session = :session
    """

    query :delete, """
    DELETE FROM sessions.logins
    WHERE session = :session
    """
  end

  def init(opts), do: opts

  def get(_conn, sid, _opts) when sid in [nil, ""], do: {nil, %{}}

  def get(_conn, sid, _opts) do
    select = Xandra.execute!(:xandra, Login.query(:select), %{"session" => sid})

    case Enum.fetch(select, 0) do
      {:ok, session} -> {sid, session}
      :error -> {nil, %{}}
    end
  end

  def put(_conn, nil, session, _opts) do
    %{"id" => id, "is_verified" => is_verified, "ttl" => ttl} = session

    sid =
      :crypto.strong_rand_bytes(64)
      |> Base.encode32(padding: false)
      |> String.downcase()

    values = %{"session" => sid, "id" => id, "is_verified" => is_verified, "ttl" => ttl}
    Xandra.execute!(:xandra, Login.query(:update), values)
    sid
  end

  def put(_conn, sid, _session, _opts), do: sid

  def delete(_conn, sid, _opts) do
    Xandra.execute!(:xandra, Login.query(:delete), %{"session" => sid})
    :ok
  end
end
