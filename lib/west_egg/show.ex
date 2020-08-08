defmodule WestEgg.Show do
  defmodule Profile do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :display, :handle]

    query :insert, """
    INSERT INTO shows.profiles (id, handle, display, since)
    VALUES (:id, :handle, :display, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM shows.profiles
    WHERE id = :id
    """

    query :update, """
    UPDATE shows.profiles
    SET handle = :handle,
        display = :display
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM shows.profiles
    WHERE id = :id
    """
  end

  defmodule Owner do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :owner]

    query :insert, """
    INSERT INTO shows.owners (id, owner, since)
    VALUES (:id, :owner, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM shows.owners
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM shows.owners
    WHERE id = :id
    AND owner = :owner
    """

    query :delete, """
    DELETE FROM shows.owners
    WHERE id = :id
    AND owner = :owner
    """
  end

  defmodule Video do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :video]

    query :insert, """
    INSERT INTO shows.videos (id, video, since)
    VALUES (:id, :video, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM shows.videos
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM shows.videos
    WHERE id = :id
    AND video = :video
    """

    query :delete, """
    DELETE FROM shows.videos
    WHERE id = :id
    AND video = :video
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

  def videos(:insert, %Video{} = video) do
    video = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), video)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Video.query(:insert), video)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def videos(:select, %Video{} = video) do
    video = Video.to_params(video)
    result = Xandra.execute!(:xandra, Video.query(:select), video)
    {:ok, result}
  end

  def videos(:select_one, %Video{} = video) do
    video = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), video)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def videos(:delete, %Video{} = video) do
    video = Video.to_params(video)
    Xandra.execute!(:xandra, Video.query(:delete), video)
    :ok
  end

  def videos([{:error, _} | _] = batch, _op, _data), do: batch

  def videos(batch, :insert, %Video{} = video) do
    video = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), video)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Video.query(:insert), video)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def videos(batch, :delete, %Video{} = video) do
    video = Video.to_params(video)
    query = &Xandra.Batch.add(&1, Video.query(:delete), video)
    [{:ok, query} | batch]
  end
end
