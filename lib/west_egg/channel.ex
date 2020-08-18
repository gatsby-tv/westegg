defmodule WestEgg.Channel do
  defmodule Profile do
    defstruct [:id, :handle, :display, :since]

    use WestEgg.Parameters
    import WestEgg.Query

    query :insert, """
    INSERT INTO channels.profiles (id, handle, display, since)
    VALUES (:id, :handle, :display, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM channels.profiles
    WHERE id = :id
    """

    query :update, """
    UPDATE channels.profiles
    SET handle = :handle,
        display = :display
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM channels.profiles
    WHERE id = :id
    """
  end

  defmodule Statistics do
    defstruct [
      :id,
      owners: 0,
      subscribers: 0,
      shows: 0,
      videos: 0
    ]

    use WestEgg.Parameters
    import WestEgg.Query

    query :increment, """
    UPDATE channels.statistics
    SET owners = owners + :owners,
        subscribers = subscribers + :subscribers,
        shows = shows + :shows,
        videos = videos + :videos
    WHERE id = :id
    """

    query :decrement, """
    UPDATE channels.statistics
    SET owners = owners - :owners,
        subscribers = subscribers - :subscribers,
        shows = shows - :shows,
        videos = videos - :videos
    WHERE id = :id
    """
  end

  defmodule Owner do
    defstruct [:id, :owner, :since]

    use WestEgg.Parameters
    use WestEgg.Paging, method: &WestEgg.Channel.owners/3
    import WestEgg.Query

    query :insert, """
    INSERT INTO channels.owners (id, owner, since)
    VALUES (:id, :owner, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM channels.owners
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM channels.owners
    WHERE id = :id
    AND owner = :owner
    """

    query :delete, """
    DELETE FROM channels.owners
    WHERE id = :id
    AND owner = :owner
    """
  end

  defmodule Subscriber do
    defstruct [:id, :subscriber, :since]

    use WestEgg.Parameters
    use WestEgg.Paging, method: &WestEgg.Channel.subscribers/3
    import WestEgg.Query

    query :insert, """
    INSERT INTO channels.subscribers (id, subscriber, since)
    VALUES (:id, :subscriber, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM channels.subscribers
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM channels.subscribers
    WHERE id = :id
    AND subscriber = :subscriber
    """

    query :delete, """
    DELETE FROM channels.subscribers
    WHERE id = :id
    AND subscriber = :subscriber
    """
  end

  defmodule Show do
    defstruct [:id, :show, :since]

    use WestEgg.Parameters
    use WestEgg.Paging, method: &WestEgg.Channel.shows/3
    import WestEgg.Query

    query :insert, """
    INSERT INTO channels.shows (id, show, since)
    VALUES (:id, :show, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM channels.shows
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM channels.shows
    WHERE id = :id
    AND show = :show
    """

    query :delete, """
    DELETE FROM channels.shows
    WHERE id = :id
    AND show = :show
    """
  end

  defmodule Video do
    defstruct [:id, :video, :since]

    use WestEgg.Parameters
    use WestEgg.Paging, method: &WestEgg.Channel.videos/3
    import WestEgg.Query

    query :insert, """
    INSERT INTO channels.videos (id, video, since)
    VALUES (:id, :video, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM channels.videos
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM channels.videos
    WHERE id = :id
    AND video = :video
    """

    query :delete, """
    DELETE FROM channels.videos
    WHERE id = :id
    AND video = :video
    """
  end

  def profile(op, data, opts \\ [])

  def profile(:insert, %Profile{} = profile, _opts) do
    params = Profile.to_params(profile)
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
    params = Profile.to_params(profile)
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

  def statistics(op, data, opts \\ [])

  def statistics(:increment, %Statistics{} = statistics, _opts) do
    params = Statistics.to_params(statistics)
    Xandra.execute!(:xandra, Statistics.query(:increment), params)
    :ok
  end

  def statistics(:decrement, %Statistics{} = statistics, _opts) do
    params = Statistics.to_params(statistics)
    Xandra.execute!(:xandra, Statistics.query(:decrement), params)
    :ok
  end

  def statistics([{:error, _} | _] = batch, _op, _data), do: batch

  def statistics(batch, :increment, %Statistics{} = statistics) do
    params = Statistics.to_params(statistics)
    query = &Xandra.Batch.add(&1, Statistics.query(:increment), params)
    [{:ok, query} | batch]
  end

  def statistics(batch, :decrement, %Statistics{} = statistics) do
    params = Statistics.to_params(statistics)
    query = &Xandra.Batch.add(&1, Statistics.query(:decrement), params)
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

  def subscribers(op, data, opts \\ [])

  def subscribers(:insert, %Subscriber{} = subscriber, _opts) do
    params = Subscriber.to_params(subscriber)
    select = Xandra.execute!(:xandra, Subscriber.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Subscriber.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def subscribers(:select, %Subscriber{} = subscriber, opts) do
    params = Subscriber.to_params(subscriber)
    result = Xandra.execute!(:xandra, Subscriber.query(:select), params, opts)
    {:ok, result}
  end

  def subscribers(:select_one, %Subscriber{} = subscriber, _opts) do
    params = Subscriber.to_params(subscriber)
    select = Xandra.execute!(:xandra, Subscriber.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Subscriber.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def subscribers(:delete, %Subscriber{} = subscriber, _opts) do
    params = Subscriber.to_params(subscriber)
    Xandra.execute!(:xandra, Subscriber.query(:delete), params)
    :ok
  end

  def subscribers([{:error, _} | _] = batch, _op, _data), do: batch

  def subscribers(batch, :insert, %Subscriber{} = subscriber) do
    params = Subscriber.to_params(subscriber)
    select = Xandra.execute!(:xandra, Subscriber.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Subscriber.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :subscriber, nil}} | batch]
    end
  end

  def subscribers(batch, :delete, %Subscriber{} = subscriber) do
    params = Subscriber.to_params(subscriber)
    query = &Xandra.Batch.add(&1, Subscriber.query(:delete), params)
    [{:ok, query} | batch]
  end

  def shows(op, data, opts \\ [])

  def shows(:insert, %Show{} = show, _opts) do
    params = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Show.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def shows(:select, %Show{} = show, opts) do
    params = Show.to_params(show)
    result = Xandra.execute!(:xandra, Show.query(:select), params, opts)
    {:ok, result}
  end

  def shows(:select_one, %Show{} = show, _opts) do
    params = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Show.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def shows(:delete, %Show{} = show, _opts) do
    params = Show.to_params(show)
    Xandra.execute!(:xandra, Show.query(:delete), params)
    :ok
  end

  def shows([{:error, _} | _] = batch, _op, _data), do: batch

  def shows(batch, :insert, %Show{} = show) do
    params = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Show.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :show, nil}} | batch]
    end
  end

  def shows(batch, :delete, %Show{} = show) do
    params = Show.to_params(show)
    query = &Xandra.Batch.add(&1, Show.query(:delete), params)
    [{:ok, query} | batch]
  end

  def videos(op, data, opts \\ [])

  def videos(:insert, %Video{} = video, _opts) do
    params = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Video.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def videos(:select, %Video{} = video, opts) do
    params = Video.to_params(video)
    result = Xandra.execute!(:xandra, Video.query(:select), params, opts)
    {:ok, result}
  end

  def videos(:select_one, %Video{} = video, _opts) do
    params = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Video.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def videos(:delete, %Video{} = video, _opts) do
    params = Video.to_params(video)
    Xandra.execute!(:xandra, Video.query(:delete), params)
    :ok
  end

  def videos([{:error, _} | _] = batch, _op, _data), do: batch

  def videos(batch, :insert, %Video{} = video) do
    params = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Video.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :video, nil}} | batch]
    end
  end

  def videos(batch, :delete, %Video{} = video) do
    params = Video.to_params(video)
    query = &Xandra.Batch.add(&1, Video.query(:delete), params)
    [{:ok, query} | batch]
  end
end
