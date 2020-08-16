defmodule WestEgg.User do
  defmodule Profile do
    defstruct [:id, :handle, :display, :since]

    use WestEgg.Parameters
    import WestEgg.Query

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
    defstruct [:id, :follower, :since]

    use WestEgg.Parameters
    import WestEgg.Query

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
    defstruct [:id, :follow, :since]

    use WestEgg.Parameters
    import WestEgg.Query

    query :insert, """
    INSERT INTO users.follows (id, follow, since)
    VALUES (:id, :follow, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.follows
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.follows
    WHERE id = :id
    AND follow = :follow
    """

    query :delete, """
    DELETE FROM users.follows
    WHERE id = :id
    AND follow = :follow
    """
  end

  defmodule Subscription do
    defstruct [:id, :subscription, :since]

    use WestEgg.Parameters
    import WestEgg.Query

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

  defmodule Promotion do
    defstruct [:id, :promotion, :since]

    use WestEgg.Parameters
    import WestEgg.Query

    query :insert, """
    INSERT INTO users.promotions (id, promotion, since)
    VALUES (:id, :promotion, toUnixTimestamp(now()))
    """

    query :select, """
    SELECT * FROM users.promotions
    WHERE id = :id
    """

    query :select_one, """
    SELECT * FROM users.promotions
    WHERE id = :id
    AND promotion = :promotion
    """

    query :delete, """
    DELETE FROM users.promotions
    WHERE id = :id
    AND promotion = :promotion
    """
  end

  defmodule Channel do
    defstruct [:id, :channel, :since]

    use WestEgg.Parameters
    import WestEgg.Query

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
    defstruct [:id, :show, :since]

    use WestEgg.Parameters
    import WestEgg.Query

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
    defstruct [:id, :video, :since]

    use WestEgg.Parameters
    import WestEgg.Query

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

  def profile(:select, %Profile{} = profile) do
    params = Profile.to_params(profile)
    select = Xandra.execute!(:xandra, Profile.query(:select), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Profile.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def profile(:update, %Profile{} = profile) do
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

  def profile(:delete, %Profile{} = profile) do
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
        [{:error, {:exists, :profile, profile}} | batch]
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
        [{:error, {:not_found, :profile, profile}} | batch]
    end
  end

  def profile(batch, :delete, %Profile{} = profile) do
    params = Profile.to_params(profile)
    query = &Xandra.Batch.add(&1, Profile.query(:delete), params)
    [{:ok, query} | batch]
  end

  def followers(:insert, %Follower{} = follower) do
    params = Follower.to_params(follower)
    select = Xandra.execute!(:xandra, Follower.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Follower.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def followers(:select, %Follower{} = follower) do
    params = Follower.to_params(follower)
    result = Xandra.execute!(:xandra, Follower.query(:select), params)
    {:ok, result}
  end

  def followers(:select_one, %Follower{} = follower) do
    params = Follower.to_params(follower)
    select = Xandra.execute!(:xandra, Follower.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Follower.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def followers(:delete, %Follower{} = follower) do
    params = Follower.to_params(follower)
    Xandra.execute!(:xandra, Follower.query(:delete), params)
    :ok
  end

  def followers([{:error, _} | _] = batch, _op, _data), do: batch

  def followers(batch, :insert, %Follower{} = follower) do
    params = Follower.to_params(follower)
    select = Xandra.execute!(:xandra, Follower.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Follower.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :follower, follower}} | batch]
    end
  end

  def followers(batch, :delete, %Follower{} = follower) do
    params = Follower.to_params(follower)
    query = &Xandra.Batch.add(&1, Follower.query(:delete), params)
    [{:ok, query} | batch]
  end

  def follows(:insert, %Follow{} = follow) do
    params = Follow.to_params(follow)
    select = Xandra.execute!(:xandra, Follow.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Follow.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def follows(:select, %Follow{} = follow) do
    params = Follow.to_params(follow)
    result = Xandra.execute!(:xandra, Follow.query(:select), params)
    {:ok, result}
  end

  def follows(:select_one, %Follow{} = follow) do
    params = Follow.to_params(follow)
    select = Xandra.execute!(:xandra, Follow.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Follow.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def follows(:delete, %Follow{} = follow) do
    params = Follow.to_params(follow)
    Xandra.execute!(:xandra, Follow.query(:delete), params)
    :ok
  end

  def follows([{:error, _} | _] = batch, _op, _data), do: batch

  def follows(batch, :insert, %Follow{} = follow) do
    params = Follow.to_params(follow)
    select = Xandra.execute!(:xandra, Follow.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Follow.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :follow, follow}} | batch]
    end
  end

  def follows(batch, :delete, %Follow{} = follow) do
    params = Follow.to_params(follow)
    query = &Xandra.Batch.add(&1, Follow.query(:delete), params)
    [{:ok, query} | batch]
  end

  def subscriptions(:insert, %Subscription{} = subscription) do
    params = Subscription.to_params(subscription)
    select = Xandra.execute!(:xandra, Subscription.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Subscription.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def subscriptions(:select, %Subscription{} = subscription) do
    params = Subscription.to_params(subscription)
    result = Xandra.execute!(:xandra, Subscription.query(:select), params)
    {:ok, result}
  end

  def subscriptions(:select_one, %Subscription{} = subscription) do
    params = Subscription.to_params(subscription)
    select = Xandra.execute!(:xandra, Subscription.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Subscription.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def subscriptions(:delete, %Subscription{} = subscription) do
    params = Subscription.to_params(subscription)
    Xandra.execute!(:xandra, Subscription.query(:delete), params)
    :ok
  end

  def subscriptions([{:error, _} | _] = batch, _op, _data), do: batch

  def subscriptions(batch, :insert, %Subscription{} = subscription) do
    params = Subscription.to_params(subscription)
    select = Xandra.execute!(:xandra, Subscription.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Subscription.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :subscription, subscription}} | batch]
    end
  end

  def subscriptions(batch, :delete, %Subscription{} = subscription) do
    params = Subscription.to_params(subscription)
    query = &Xandra.Batch.add(&1, Subscription.query(:delete), params)
    [{:ok, query} | batch]
  end

  def promotions(:insert, %Promotion{} = promotion) do
    params = Promotion.to_params(promotion)
    select = Xandra.execute!(:xandra, Promotion.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Promotion.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def promotions(:select, %Promotion{} = promotion) do
    params = Promotion.to_params(promotion)
    result = Xandra.execute!(:xandra, Promotion.query(:select), params)
    {:ok, result}
  end

  def promotions(:select_one, %Promotion{} = promotion) do
    params = Promotion.to_params(promotion)
    select = Xandra.execute!(:xandra, Promotion.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Promotion.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def promotions(:delete, %Promotion{} = promotion) do
    params = Promotion.to_params(promotion)
    Xandra.execute!(:xandra, Promotion.query(:delete), params)
    :ok
  end

  def promotions([{:error, _} | _] = batch, _op, _data), do: batch

  def promotions(batch, :insert, %Promotion{} = promotion) do
    params = Promotion.to_params(promotion)
    select = Xandra.execute!(:xandra, Promotion.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Promotion.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :promotion, promotion}} | batch]
    end
  end

  def promotions(batch, :delete, %Promotion{} = promotion) do
    params = Promotion.to_params(promotion)
    query = &Xandra.Batch.add(&1, Promotion.query(:delete), params)
    [{:ok, query} | batch]
  end

  def channels(:insert, %Channel{} = channel) do
    params = Channel.to_params(channel)
    select = Xandra.execute!(:xandra, Channel.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        Xandra.execute!(:xandra, Channel.query(:insert), params)
        :ok

      {:ok, _} ->
        {:error, :exists}
    end
  end

  def channels(:select, %Channel{} = channel) do
    params = Channel.to_params(channel)
    result = Xandra.execute!(:xandra, Channel.query(:select), params)
    {:ok, result}
  end

  def channels(:select_one, %Channel{} = channel) do
    params = Channel.to_params(channel)
    select = Xandra.execute!(:xandra, Channel.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Channel.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def channels(:delete, %Channel{} = channel) do
    params = Channel.to_params(channel)
    Xandra.execute!(:xandra, Channel.query(:delete), params)
    :ok
  end

  def channels([{:error, _} | _] = batch, _op, _data), do: batch

  def channels(batch, :insert, %Channel{} = channel) do
    params = Channel.to_params(channel)
    select = Xandra.execute!(:xandra, Channel.query(:select_one), params)

    case Enum.fetch(select, 0) do
      :error ->
        query = &Xandra.Batch.add(&1, Channel.query(:insert), params)
        [{:ok, query} | batch]

      {:ok, _} ->
        [{:error, {:exists, :channel, channel}} | batch]
    end
  end

  def channels(batch, :delete, %Channel{} = channel) do
    params = Channel.to_params(channel)
    query = &Xandra.Batch.add(&1, Channel.query(:delete), params)
    [{:ok, query} | batch]
  end

  def shows(:insert, %Show{} = show) do
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

  def shows(:select, %Show{} = show) do
    params = Show.to_params(show)
    result = Xandra.execute!(:xandra, Show.query(:select), params)
    {:ok, result}
  end

  def shows(:select_one, %Show{} = show) do
    params = Show.to_params(show)
    select = Xandra.execute!(:xandra, Show.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Show.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def shows(:delete, %Show{} = show) do
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
        [{:error, {:exists, :show, show}} | batch]
    end
  end

  def shows(batch, :delete, %Show{} = show) do
    params = Show.to_params(show)
    query = &Xandra.Batch.add(&1, Show.query(:delete), params)
    [{:ok, query} | batch]
  end

  def videos(:insert, %Video{} = video) do
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

  def videos(:select, %Video{} = video) do
    params = Video.to_params(video)
    result = Xandra.execute!(:xandra, Video.query(:select), params)
    {:ok, result}
  end

  def videos(:select_one, %Video{} = video) do
    params = Video.to_params(video)
    select = Xandra.execute!(:xandra, Video.query(:select_one), params)

    case Enum.fetch(select, 0) do
      {:ok, result} -> {:ok, Video.from_binary_map(result)}
      :error -> {:error, :not_found}
    end
  end

  def videos(:delete, %Video{} = video) do
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
        [{:error, {:exists, :video, video}} | batch]
    end
  end

  def videos(batch, :delete, %Video{} = video) do
    params = Video.to_params(video)
    query = &Xandra.Batch.add(&1, Video.query(:delete), params)
    [{:ok, query} | batch]
  end
end
