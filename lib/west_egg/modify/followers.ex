defmodule WestEgg.Modify.Followers do
  use WestEgg.Modify,
    spec: [
      user: :required,
      session: :phantom
    ]

  @impl true
  def modify(:add, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> fetch(:user)
    |> validate(:add, :user)
    |> stage(:add, :followers)
    |> stage(:add, :session)
    |> stage(:add, :user)
    |> finish(conn)
  end

  @impl true
  def modify(:remove, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> fetch(:user)
    |> validate(:remove, :user)
    |> stage(:remove, :followers)
    |> stage(:remove, :session)
    |> stage(:remove, :user)
    |> finish(conn)
  end

  defp authorize(params, conn) do
    if Auth.verified?(conn), do: params, else: raise(Auth.AuthorizationError)
  end

  defp fetch(%{user: user} = params, :user) do
    case Repo.lookup(:repo, :user, user) do
      {:ok, id} -> Map.put(params, :user, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown user, '#{user}'")
      {:error, reason} -> raise reason
    end
  end

  defp validate(%{user: user, session: session} = params, :add, :user) do
    if user == session do
      fail("cannot follow session user")
    else
      case Repo.fetch(:repo, :users, session, :following) do
        {:ok, %{"following" => following}} ->
          if user in following,
            do: fail("session already following '#{user}'"),
            else: params

        {:ok, _} ->
          params

        {:error, reason} ->
          raise reason
      end
    end
  end

  defp validate(%{user: user, session: session} = params, :remove, :user) do
    if user == session do
      fail("cannot unfollow session user")
    else
      case Repo.fetch(:repo, :users, session, :following) do
        {:ok, %{"following" => following}} ->
          if user not in following,
            do: fail("session not following '#{user}'"),
            else: params

        {:ok, _} ->
          params

        {:error, reason} ->
          raise reason
      end
    end
  end

  defp stage(%{user: user, session: session} = params, :add, :followers) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()
    methods = %{
      "_type" => Repo.set("plain/text"),
      "since" => Repo.set(now)
    }
    Repo.modify(:repo, :followers, user, session, methods)
    params
  end

  defp stage(%{user: user, session: session} = params, :add, :session) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "following" => Repo.add_element(user)
    }
    Repo.modify(:repo, :users, session, :following, methods)
    params
  end

  defp stage(%{user: user} = params, :add, :user) do
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "followers" => Repo.increment()
    }
    Repo.modify(:repo, :users, user, :followers, methods)
    params
  end

  defp stage(%{user: user, session: session} = params, :remove, :followers) do
    Repo.drop(:repo, :followers, user, session)
    params
  end

  defp stage(%{user: user, session: session} = params, :remove, :session) do
    methods = %{"following" => Repo.del_element(user)}
    Repo.modify(:repo, :users, session, :following, methods)
    params
  end

  defp stage(%{user: user} = params, :remove, :user) do
    methods = %{"followers" => Repo.decrement()}
    Repo.modify(:repo, :users, user, :followers, methods)
    params
  end
end
