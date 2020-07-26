defmodule WestEgg.Modify.Subscribers do
  use WestEgg.Modify,
    spec: [
      channel: :required,
      session: :phantom
    ]

  @impl true
  def modify(:add, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> fetch(:channel)
    |> validate(:add, :channel)
    |> stage(:add, :subscribers)
    |> stage(:add, :session)
    |> stage(:add, :channel)
    |> finish(conn)
  end

  @impl true
  def modify(:remove, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> fetch(:channel)
    |> validate(:remove, :channel)
    |> stage(:remove, :subscribers)
    |> stage(:remove, :session)
    |> stage(:remove, :channel)
    |> finish(conn)
  end

  defp authorize(params, conn) do
    if Auth.verified?(conn), do: params, else: raise Auth.AuthorizationError
  end

  defp fetch(%{channel: channel} = params, :channel) do
    case Repo.lookup(:repo, :channel, channel) do
      {:ok, id} -> Map.put(params, :channel, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown channel, '#{channel}'")
      {:error, reason} -> raise reason
    end
  end

  defp validate(%{channel: channel, session: session} = params, :add, :channel) do
    case Repo.fetch(:repo, :users, session, :profile) do
      {:ok, profile} ->
        subscriptions = profile["subscriptions"]
        channels = profile["channels"]
        cond do
          not is_nil(subscriptions) and channel in subscriptions ->
            fail("session already subscribed to '#{channel}'")

          not is_nil(channels) and channel in channels ->
            fail("session owns '#{channel}'")

          true ->
            params
        end

      {:error, reason} ->
        raise reason
    end
  end

  defp validate(%{channel: channel, session: session} = params, :remove, :channel) do
    case Repo.fetch(:repo, :users, session, :profile) do
      {:ok, profile} ->
        subscriptions = profile["subscriptions"]
        channels = profile["channels"]
        cond do
          is_nil(subscriptions) or channel not in subscriptions ->
            fail("session not subscribed to '#{channel}'")

          not is_nil(channels) and channel in channels ->
            fail("session owns '#{channel}'")

          true ->
            params
        end

      {:error, reason} ->
        raise reason
    end
  end

  defp stage(%{channel: channel, session: session} = params, :add, :subscribers) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()
    methods = %{
      "_type" => Repo.set("plain/text"),
      "since" => Repo.set(now)
    }
    Repo.modify(:repo, :subscribers, channel, session, methods)
    params
  end

  defp stage(%{channel: channel, session: session} = params, :add, :session) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "subscriptions" => Repo.add_element(channel)
    }
    Repo.modify(:repo, :users, session, :subscriptions, methods)
    params
  end

  defp stage(%{channel: channel} = params, :add, :channel) do
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "subscribers" => Repo.increment()
    }
    Repo.modify(:repo, :channels, channel, :subscribers, methods)
    params
  end

  defp stage(%{channel: channel, session: session} = params, :remove, :subscribers) do
    Repo.drop(:repo, :subscribers, channel, session)
    params
  end

  defp stage(%{channel: channel, session: session} = params, :remove, :session) do
    methods = %{"subscriptions" => Repo.del_element(channel)}
    Repo.modify(:repo, :users, session, :subscriptions, methods)
    params
  end

  defp stage(%{channel: channel} = params, :remove, :channel) do
    methods = %{"subscribers" => Repo.decrement()}
    Repo.modify(:repo, :channels, channel, :subscribers, methods)
    params
  end
end
