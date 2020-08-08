defmodule WestEgg.User do
  defmodule Profile do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :handle, :display]

    query :insert, """
    INSERT INTO users.profiles (id, handle, display, since)
    VALUES (:id, :handle, :display, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.profiles
    WHERE id = :id
    """

    query :update, """
    UPDATE users.profiles
    SET handle = :handle,
        display = :display
    WHERE id = :id
    """

    query :delete, """
    DELETE FROM users.profiles
    WHERE id = :id
    """
  end

  defmodule Follower do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :follower]

    query :insert, """
    INSERT INTO users.followers (id, follower, since)
    VALUES (:id, :follower, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.followers
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.followers
    WHERE id = :id
    AND follower = :follower
    """

    query :delete, """
    DELETE FROM users.followers
    WHERE id = :id
    AND follower = :follower
    """
  end

  defmodule Follow do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :follow]

    query :insert, """
    INSERT INTO users.following (id, follow, since)
    VALUES (:id, :follow, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.following
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.following
    WHERE id = :id
    AND follow = :follow
    """

    query :delete, """
    DELETE FROM users.following
    WHERE id = :id
    AND follow = :follow
    """
  end

  defmodule Subscription do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :subscription]

    query :insert, """
    INSERT INTO users.subscriptions (id, subscription, since)
    VALUES (:id, :subscription, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.subscriptions
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.subscriptions
    WHERE id = :id
    AND subscription = :subscription
    """

    query :delete, """
    DELETE FROM users.subscriptions
    WHERE id = :id
    AND subscription = :subscription
    """
  end

  defmodule Channel do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :channel]

    query :insert, """
    INSERT INTO users.channels (id, channel, since)
    VALUES (:id, :channel, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.channels
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.channels
    WHERE id = :id
    AND channel = :channel
    """

    query :delete, """
    DELETE FROM users.channels
    WHERE id = :id
    AND channel = :channel
    """
  end

  defmodule Show do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :show]

    query :insert, """
    INSERT INTO users.shows (id, show, since)
    VALUES (:id, :show, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.shows
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.shows
    WHERE id = :id
    AND show = :show
    """

    query :delete, """
    DELETE FROM users.shows
    WHERE id = :id
    AND show = :show
    """
  end

  defmodule Video do
    use WestEgg.Parameters
    import WestEgg.Query

    defstruct [:id, :video]

    query :insert, """
    INSERT INTO users.videos (id, video, since)
    VALUES (:id, :video, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.videos
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.videos
    WHERE id = :id
    AND video = :video
    """

    query :delete, """
    DELETE FROM users.videos
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

  def followers(:insert, %Follower{} = follower) do
    follow =
      %Follow{id: follower.follower, follow: follower.id}
      |> Follow.to_params()

    follower = Follower.to_params(follower)
    select = Xandra.execute!(:xandra, Follower.query(:select_one), follower)

    case Enum.fetch(select, 0) do
      :error ->
        batch =
          Xandra.Batch.new()
          |> Xandra.Batch.add(Follower.query(:insert), follower)
          |> Xandra.Batch.add(Follow.query(:insert), follow)

        Xandra.execute!(:xandra, batch)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def followers(:select, %Follower{} = follower) do
    follower = Follower.to_params(follower)
    result = Xandra.execute!(:xandra, Follower.query(:select), follower)
    {:ok, result}
  end

  def followers(:select_one, %Follower{} = follower) do
    follower = Follower.to_params(follower)
    select = Xandra.execute!(:xandra, Follower.query(:select_one), follower)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def followers(:delete, %Follower{} = follower) do
    follow =
      %Follow{id: follower.follower, follow: follower.id}
      |> Follow.to_params()

    follower = Follower.to_params(follower)

    batch =
      Xandra.Batch.new()
      |> Xandra.Batch.add(Follower.query(:delete), follower)
      |> Xandra.Batch.add(Follow.query(:delete), follow)

    Xandra.execute!(:xandra, batch)
    :ok
  end

  def followers([{:error, _} | _] = batch, _op, _data), do: batch

  def followers(batch, :insert, %Follower{} = follower) do
    follow =
      %Follow{id: follower.follower, follow: follower.id}
      |> Follow.to_params()

    follower = Follower.to_params(follower)

    select = Xandra.execute!(:xandra, Follower.query(:select_one), follower)

    case Enum.fetch(select, 0) do
      :error ->
        query = fn acc ->
          acc
          |> Xandra.Batch.add(Follower.query(:insert), follower)
          |> Xandra.Batch.add(Follow.query(:insert), follow)
        end

        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def followers(batch, :delete, %Follower{} = follower) do
    follow =
      %Follow{id: follower.follower, follow: follower.id}
      |> Follow.to_params()

    follower = Follower.to_params(follower)

    query = fn acc ->
      acc
      |> Xandra.Batch.add(Follower.query(:delete), follower)
      |> Xandra.Batch.add(Follow.query(:delete), follow)
    end

    [{:ok, query} | batch]
  end

  def following(:select, %Follow{} = follow) do
    follow = Follow.to_params(follow)
    result = Xandra.execute!(:xandra, Follow.query(:select), follow)
    {:ok, result}
  end

  def following(:select_one, %Follow{} = follow) do
    follow = Follow.to_params(follow)
    select = Xandra.execute!(:xandra, Follow.query(:select_one), follow)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def subscriptions(:insert, %Subscription{} = subscription) do
    subscription = Subscription.to_params(subscription)
    select = Xandra.execute!(:xandra, Subscription.query(:select_one), subscription)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Subscription.query(:insert), subscription)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def subscriptions(:select, %Subscription{} = subscription) do
    subscription = Subscription.to_params(subscription)
    result = Xandra.execute!(:xandra, Subscription.query(:select), subscription)
    {:ok, result}
  end

  def subscriptions(:select_one, %Subscription{} = subscription) do
    subscription = Subscription.to_params(subscription)
    select = Xandra.execute!(:xandra, Subscription.query(:select_one), subscription)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def subscriptions(:delete, %Subscription{} = subscription) do
    subscription = Subscription.to_params(subscription)
    Xandra.execute!(:xandra, Subscription.query(:delete), subscription)
    :ok
  end

  def subscriptions([{:error, _} | _] = batch, _op, _data), do: batch

  def subscriptions(batch, :insert, %Subscription{} = subscription) do
    subscription = Subscription.to_params(subscription)
    select = Xandra.execute!(:xandra, Subscription.query(:select_one), subscription)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Subscription.query(:insert), subscription)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def subscriptions(batch, :delete, %Subscription{} = subscription) do
    subscription = Subscription.to_params(subscription)
    query = &Xandra.Batch.add(&1, Subscription.query(:delete), subscription)
    [{:ok, query} | batch]
  end

  def channels(:insert, %Channel{} = channel) do
    channel = Channel.to_params(channel)
    select = Xandra.execute!(:xandra, Channel.query(:select_one), channel)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Channel.query(:insert), channel)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def channels(:select, %Channel{} = channel) do
    channel = Channel.to_params(channel)
    result = Xandra.execute!(:xandra, Channel.query(:select), channel)
    {:ok, result}
  end

  def channels(:select_one, %Channel{} = channel) do
    channel = Channel.to_params(channel)
    select = Xandra.execute!(:xandra, Channel.query(:select_one), channel)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def channels(:delete, %Channel{} = channel) do
    channel = Channel.to_params(channel)
    Xandra.execute!(:xandra, Channel.query(:delete), channel)
    :ok
  end

  def channels([{:error, _} | _] = batch, _op, _data), do: batch

  def channels(batch, :insert, %Channel{} = channel) do
    channel = Channel.to_params(channel)
    select = Xandra.execute!(:xandra, Channel.query(:select_one), channel)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Channel.query(:insert), channel)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def channels(batch, :delete, %Channel{} = channel) do
    channel = Channel.to_params(channel)
    query = &Xandra.Batch.add(&1, Channel.query(:delete), channel)
    [{:ok, query} | batch]
  end

  def shows(:insert, %Show{} = show) do
    show = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), show)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Show.query(:insert), show)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def shows(:select, %Show{} = show) do
    show = Show.to_params(show)
    result = Xandra.execute!(:xandra, Show.query(:select), show)
    {:ok, result}
  end

  def shows(:select_one, %Show{} = show) do
    show = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), show)

    case Enum.fetch(select, 0) do
      :error -> {:error, :not_found}
      ok -> ok
    end
  end

  def shows(:delete, %Show{} = show) do
    show = Show.to_params(show)
    Xandra.execute!(:xandra, Show.query(:delete), show)
    :ok
  end

  def shows([{:error, _} | _] = batch, _op, _data), do: batch

  def shows(batch, :insert, %Show{} = show) do
    show = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), show)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Show.query(:insert), show)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, :exists} | batch]
    end
  end

  def shows(batch, :delete, %Show{} = show) do
    show = Show.to_params(show)
    query = &Xandra.Batch.add(&1, Show.query(:delete), show)
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
