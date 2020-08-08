defmodule WestEgg.Video do
  defmodule Profile do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :handle, :display]

    query :insert, """
    INSERT INTO videos.profiles (id, handle, display, since)
    VALUES (:id, :handle, :display, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM videos.profiles
    WHERE id = :id
    """

    query :update, """
    UPDATE videos.profiles
    SET handle = :handle,
        display = :display
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM videos.profiles
    WHERE id = :id
    """
  end

  defmodule Owner do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :owner]

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
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :promoter]

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

  def profile(:insert, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), profile)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Profile.query(:insert), profile)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def profile(:select, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), profile)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def profile(:update, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), profile)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        Xandra.execute!(:xandra, Profile.query(:update), Map.merge(current, profile))
        :ok

      :error ->
        {:error, :not_found}
    end
  end

  def profile(:delete, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    Xandra.execute!(:xandra, Profile.query(:delete), profile)
    :ok
  end

  def profile([{:error, _} | _] = batch, _op, _data), do: batch

  def profile(batch, :insert, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), profile)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Profile.query(:insert), profile)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def profile(batch, :update, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), profile)

    case Enum.fetch(select, 0) do
      {:ok, current} ->
        query = &Xandra.Batch.add(&1, Profile.query(:update), Map.merge(current, profile))
        [{:ok, query} | batch]

      :error ->
        [{:error, :not_found} | batch]
    end
  end

  def profile(batch, :delete, %Profile{} = profile) do
    profile = Profile.to_params(profile)
    query = &Xandra.Batch.add(&1, Profile.query(:delete), profile)
    [{:ok, query} | batch]
  end

  def owners(:insert, %Owner{} = owner) do
    owner = Owner.to_params(owner)
    select = Xandra.execute!(:xandra, Owner.query(:select_one), owner)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Owner.query(:insert), owner)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def owners(:select, %Owner{} = owner) do
    owner = Owner.to_params(owner)
    result = Xandra.execute!(:xandra, Owner.query(:select), owner)
    {:ok, result}
  end

  def owners(:select_one, %Owner{} = owner) do
    owner = Owner.to_params(owner)
    select = Xandra.execute!(:xandra, Owner.query(:select_one), owner)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def owners(:delete, %Owner{} = owner) do
    owner = Owner.to_params(owner)
    Xandra.execute!(:xandra, Owner.query(:delete), owner)
    :ok
  end

  def owners([{:error, _} | _] = batch, _op, _data), do: batch

  def owners(batch, :insert, %Owner{} = owner) do
    owner = Owner.to_params(owner)
    select = Xandra.execute!(:xandra, Owner.query(:select_one), owner)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Owner.query(:insert), owner)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def owners(batch, :delete, %Owner{} = owner) do
    owner = Owner.to_params(owner)
    query = &Xandra.Batch.add(&1, Owner.query(:delete), owner)
    [{:ok, query} | batch]
  end

  def promoters(:insert, %Promoter{} = promoter) do
    promoter = Promoter.to_params(promoter)
    select = Xandra.execute!(:xandra, Promoter.query(:select_one), promoter)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Promoter.query(:insert), promoter)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def promoters(:select, %Promoter{} = promoter) do
    promoter = Promoter.to_params(promoter)
    result = Xandra.execute!(:xandra, Promoter.query(:select), promoter)
    {:ok, result}
  end

  def promoters(:select_one, %Promoter{} = promoter) do
    promoter = Promoter.to_params(promoter)
    select = Xandra.execute!(:xandra, Promoter.query(:select_one), promoter)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def promoters(:delete, %Promoter{} = promoter) do
    promoter = Promoter.to_params(promoter)
    Xandra.execute!(:xandra, Promoter.query(:delete), promoter)
    :ok
  end

  def promoters([{:error, _} | _] = batch, _op, _data), do: batch

  def promoters(batch, :insert, %Promoter{} = promoter) do
    promoter = Promoter.to_params(promoter)
    select = Xandra.execute!(:xandra, Promoter.query(:select_one), promoter)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Promoter.query(:insert), promoter)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def promoters(batch, :delete, %Promoter{} = promoter) do
    promoter = Promoter.to_params(promoter)
    query = &Xandra.Batch.add(&1, Promoter.query(:delete), promoter)
    [{:ok, query} | batch]
  end
end
