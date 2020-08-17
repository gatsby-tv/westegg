defmodule WestEgg.Secrets do
  defmodule Login do
    defstruct [:id, :password]

    use WestEgg.Parameters
    import WestEgg.Query

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
    params = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Login.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def login(:select, %Login{} = login) do
    params = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Login.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def login(:update, %Login{} = login) do
    params = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        %{password_hash: password} = Argon2.add_hash(params["password"])
        params = Map.put(params, "password", password)
        Xandra.execute!(:xandra, Login.query(:update), Map.merge(current, params))
        :ok

      :error ->
        {:error, :not_found}
    end
  end

  def login(:delete, %Login{} = login) do
    params = Login.to_params(login)
    Xandra.execute!(:xandra, Login.query(:delete), params)
    :ok
  end

  def login([{:error, _} | _] = batch, _op, _data), do: batch

  def login(batch, :insert, %Login{} = login) do
    params = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Login.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :login, nil}} | batch]
    end
  end

  def login(batch, :update, %Login{} = login) do
    params = Login.to_params(login)
    select = Xandra.execute!(:xandra, Login.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        %{password_hash: password} = Argon2.add_hash(params["password"])
        params = Map.put(params, "password", password)
        query = &Xandra.Batch.add(&1, Login.query(:update), Map.merge(current, params))
        [{:ok, query} | batch]

      :error ->
        [{:error, {:not_found, :login, nil}} | batch]
    end
  end

  def login(batch, :delete, %Login{} = login) do
    params = Login.to_params(login)
    query = &Xandra.Batch.add(&1, Login.query(:delete), params)
    [{:ok, query} | batch]
  end
end
