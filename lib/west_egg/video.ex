defmodule WestEgg.Video do
  defmodule Profile do
    defstruct [:id, :handle, :display, :channel, :show, :since]

    use WestEgg.Parameters
    import WestEgg.Query

    query :insert, """
    INSERT INTO videos.profiles (id, handle, display, channel, show, since)
    VALUES (:id, :handle, :display, :channel, :show, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM videos.profiles
    WHERE id = :id
    """

    query :update, """
    UPDATE videos.profiles
    SET handle = :handle,
        display = :display,
        show = :show
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM videos.profiles
    WHERE id = :id
    """
  end

  defmodule Owner do
    defstruct [:id, :owner, :since]

    use WestEgg.Parameters
    use WestEgg.Paging, method: &WestEgg.Video.owners/3
    import WestEgg.Query

    query :insert, """
    INSERT INTO videos.owners (id, owner, since)
    VALUES (:id, :owner, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM videos.owners
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM videos.owners
    WHERE id = :id
    AND owner = :owner
    """

    query :delete, """
    DELETE FROM videos.owners
    WHERE id = :id
    AND owner = :owner
    """
  end

  defmodule Promoter do
    defstruct [:id, :promoter, :since]

    use WestEgg.Parameters
    use WestEgg.Paging, method: &WestEgg.Video.promoters/3
    import WestEgg.Query

    query :insert, """
    INSERT INTO videos.promoters (id, promoter, since)
    VALUES (:id, :promoter, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM videos.promoters
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM videos.promoters
    WHERE id = :id
    AND promoter = :promoter
    """

    query :delete, """
    DELETE FROM videos.promoters
    WHERE id = :id
    AND promoter = :promoter
    """
  end

  def profile(op, data, opts \\ [])

  def profile(:insert, %Profile{} = profile, _opts) do
    params =
      profile
      |> Profile.to_params()
      |> Map.put_new("show", nil)

    select = Xandra.execute!(:xandra, Profile.query(:select), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Profile.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def profile(:select, %Profile{} = profile, _opts) do
    params = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Profile.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def profile(:update, %Profile{} = profile, _opts) do
    params = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        Xandra.execute!(:xandra, Profile.query(:update), Map.merge(current, params))
        :ok

      :error ->
        {:error, :not_found}
    end
  end

  def profile(:delete, %Profile{} = profile, _opts) do
    params = Profile.to_params(profile)
    Xandra.execute!(:xandra, Profile.query(:delete), params)
    :ok
  end

  def profile([{:error, _} | _] = batch, _op, _data), do: batch

  def profile(batch, :insert, %Profile{} = profile) do
    params =
      profile
      |> Profile.to_params()
      |> Map.put_new("show", nil)

    select = Xandra.execute!(:xandra, Profile.query(:select), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Profile.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :profile, profile.handle}} | batch]
    end
  end

  def profile(batch, :update, %Profile{} = profile) do
    params = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        query = &Xandra.Batch.add(&1, Profile.query(:update), Map.merge(current, params))
        [{:ok, query} | batch]

      :error ->
        [{:error, {:not_found, :profile, profile.handle}} | batch]
    end
  end

  def profile(batch, :delete, %Profile{} = profile) do
    params = Profile.to_params(profile)
    query = &Xandra.Batch.add(&1, Profile.query(:delete), params)
    [{:ok, query} | batch]
  end

  def owners(op, data, opts \\ [])

  def owners(:insert, %Owner{} = owner, _opts) do
    params = Owner.to_params(owner)
    select = Xandra.execute!(:xandra, Owner.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Owner.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def owners(:select, %Owner{} = owner, opts) do
    params = Owner.to_params(owner)
    result = Xandra.execute!(:xandra, Owner.query(:select), params, opts)
    {:ok, result}
  end

  def owners(:select_one, %Owner{} = owner, _opts) do
    params = Owner.to_params(owner)
    select = Xandra.execute!(:xandra, Owner.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Owner.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def owners(:delete, %Owner{} = owner, _opts) do
    params = Owner.to_params(owner)
    Xandra.execute!(:xandra, Owner.query(:delete), params)
    :ok
  end

  def owners([{:error, _} | _] = batch, _op, _data), do: batch

  def owners(batch, :insert, %Owner{} = owner) do
    params = Owner.to_params(owner)
    select = Xandra.execute!(:xandra, Owner.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Owner.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :owner, nil}} | batch]
    end
  end

  def owners(batch, :delete, %Owner{} = owner) do
    params = Owner.to_params(owner)
    query = &Xandra.Batch.add(&1, Owner.query(:delete), params)
    [{:ok, query} | batch]
  end

  def promoters(op, data, opts \\ [])

  def promoters(:insert, %Promoter{} = promoter, _opts) do
    params = Promoter.to_params(promoter)
    select = Xandra.execute!(:xandra, Promoter.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Promoter.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def promoters(:select, %Promoter{} = promoter, opts) do
    params = Promoter.to_params(promoter)
    result = Xandra.execute!(:xandra, Promoter.query(:select), params, opts)
    {:ok, result}
  end

  def promoters(:select_one, %Promoter{} = promoter, _opts) do
    params = Promoter.to_params(promoter)
    select = Xandra.execute!(:xandra, Promoter.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Promoter.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def promoters(:delete, %Promoter{} = promoter, _opts) do
    params = Promoter.to_params(promoter)
    Xandra.execute!(:xandra, Promoter.query(:delete), params)
    :ok
  end

  def promoters([{:error, _} | _] = batch, _op, _data), do: batch

  def promoters(batch, :insert, %Promoter{} = promoter) do
    params = Promoter.to_params(promoter)
    select = Xandra.execute!(:xandra, Promoter.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Promoter.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :promoter, nil}} | batch]
    end
  end

  def promoters(batch, :delete, %Promoter{} = promoter) do
    params = Promoter.to_params(promoter)
    query = &Xandra.Batch.add(&1, Promoter.query(:delete), params)
    [{:ok, query} | batch]
  end
end
