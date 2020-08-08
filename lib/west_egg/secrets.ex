defmodule WestEgg.Secrets do
  defmodule Login do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :password]

    query :insert, """
    INSERT INTO secrets.logins (id, password)
    VALUES (:id, :password)
    """

    query :select, """
    SELECT * FROM secrets.logins
    WHERE id = :id
    """

    query :update, """
    UPDATE secrets.logins
    SET password = :password
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM secrets.logins
    WHERE id = :id
    """
  end

  def login(:insert, %Login{} = login) do
    login = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), login)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Login.query(:insert), login)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def login(:select, %Login{} = login) do
    login = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), login)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def login(:update, %Login{} = login) do
    login = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), login)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        Xandra.execute!(:xandra, Login.query(:update), Map.merge(current, login))
        :ok

      :error ->
        {:error, :not_found}
    end
  end

  def login(:delete, %Login{} = login) do
    login = Login.to_params(login)
    Xandra.execute!(:xandra, Login.query(:delete), login)
    :ok
  end

  def login([{:error, _} | _] = batch, _op, _data), do: batch

  def login(batch, :insert, %Login{} = login) do
    login = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), login)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Login.query(:insert), login)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def login(batch, :update, %Login{} = login) do
    login = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), login)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        query = &Xandra.Batch.add(&1, Login.query(:update), Map.merge(current, login))
        [{:ok, query} | batch]

      :error ->
        [{:error, :not_found} | batch]
    end
  end

  def login(batch, :delete, %Login{} = login) do
    login = Login.to_params(login)
    query = &Xandra.Batch.add(&1, Login.query(:delete), login)
    [{:ok, query} | batch]
  end
end
