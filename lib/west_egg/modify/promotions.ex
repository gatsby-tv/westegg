defmodule WestEgg.Modify.Promotions do
  use WestEgg.Modify,
    spec: [
      video: :required,
      quantity: :optional,
      session: :phantom,
      profile: :phantom
    ]

  @impl true
  def modify(:add, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> fetch(:video)
    |> fetch(:profile)
    |> convert_quantity()
    |> validate(:video)
    |> validate(:add, :quantity)
    |> stage(:add, :promotions)
    |> stage(:add, :session)
    |> stage(:add, :video)
    |> finish(conn)
  end

  @impl true
  def modify(:remove, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> fetch(:video)
    |> fetch(:profile)
    |> convert_quantity()
    |> validate(:video)
    |> validate(:remove, :quantity)
    |> stage(:remove, :promotions)
    |> stage(:remove, :session)
    |> stage(:remove, :video)
    |> finish(conn)
  end

  defp authorize(params, conn) do
    if Auth.verified?(conn), do: params, else: raise Auth.AuthorizationError
  end

  defp fetch(%{video: video} = params, :video) do
    case Repo.lookup(:repo, :video, video) do
      {:ok, id} -> Map.put(params, :video, id)
      {:error, %Repo.NotFoundError{}} -> fail("unknown video")
      {:error, reason} -> raise reason
    end
  end

  defp fetch(%{session: session} = params, :profile) do
    case Repo.fetch(:repo, :users, session, :profile) do
      {:ok, profile} -> Map.put(params, :profile, profile)
      {:error, reason} -> raise reason
    end
  end

  defp convert_quantity(%{quantity: nil} = params), do: Map.put(params, :quantity, 1)

  defp convert_quantity(%{quantity: quantity} = params) do
    case Integer.parse(quantity) do
      {integer, _} when integer > 0 -> Map.put(params, :quantity, integer)
      {_, _} -> fail("quantity must be positive")
      :error -> fail("invalid quantity: '#{quantity}'")
    end
  end

  defp validate(%{video: video, profile: profile} = params, :video) do
    videos = profile["videos"]
    cond do
      is_nil(videos) -> params
      video in videos -> fail("video owned by session")
      true -> params
    end
  end

  defp validate(%{quantity: quantity, profile: profile} = params, :add, :quantity) do
    votes = profile["votes"]
    cond do
      is_nil(votes) or votes < quantity -> fail("insufficient votes")
      true -> params
    end
  end

  defp validate(params, :remove, :quantity) do
    %{video: video, quantity: quantity, session: session} = params
    case Repo.fetch(:repo, :promotions, video, session) do
      {:ok, %{"quantity" => invested}} ->
        cond do
          invested < quantity -> fail("insufficient promotions")
          true -> params
        end

      {:error, %Repo.NotFoundError{}} ->
        params

      {:error, reason} ->
        raise reason
    end
  end

  defp stage(params, :add, :promotions) do
    %{video: video, quantity: quantity, session: session} = params
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "quantity" => Repo.increment(quantity)
    }
    Repo.modify(:repo, :promotions, video, session, methods)
    params
  end

  defp stage(%{quantity: quantity, session: session} = params, :add, :session) do
    methods = %{"votes" => Repo.decrement(quantity)}
    Repo.modify(:repo, :users, session, :votes, methods)
    params
  end

  defp stage(%{video: video, quantity: quantity} = params, :add, :video) do
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "promotions" => Repo.increment(quantity)
    }
    Repo.modify(:repo, :videos, video, :promotions, methods)
    params
  end

  defp stage(params, :remove, :promotions) do
    %{video: video, quantity: quantity, session: session} = params
    methods = %{"quantity" => Repo.decrement(quantity)}
    Repo.modify(:repo, :promotions, video, session, methods)
    params
  end

  defp stage(%{quantity: quantity, session: session} = params, :remove, :session) do
    quantity = trunc(0.7 * quantity)
    methods = %{"votes" => Repo.increment(quantity)}
    Repo.modify(:repo, :users, session, :votes, methods)
    params
  end

  defp stage(%{video: video, quantity: quantity} = params, :remove, :video) do
    methods = %{"promotions" => Repo.decrement(quantity)}
    Repo.modify(:repo, :videos, video, :promotions, methods)
    params
  end
end
