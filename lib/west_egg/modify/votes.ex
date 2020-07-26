defmodule WestEgg.Modify.Votes do
  use WestEgg.Modify,
    spec: [
      quantity: :required,
      session: :phantom
    ],
    ops: [:award]

  @impl true
  def modify(:award, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> authorize(conn)
    |> convert_quantity()
    |> stage(:award, :session)
    |> finish(conn)
  end

  defp authorize(params, conn) do
    if Auth.verified?(conn), do: params, else: raise(Auth.AuthorizationError)
  end

  defp convert_quantity(%{quantity: quantity} = params) do
    case Integer.parse(quantity) do
      {integer, _} when integer > 0 -> Map.put(params, :quantity, integer)
      {_, _} -> fail("quantity must be positive")
      :error -> fail("invalid quantity: '#{quantity}'")
    end
  end

  defp stage(%{quantity: quantity, session: session} = params, :award, :session) do
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "votes" => Repo.increment(quantity)
    }

    Repo.modify(:repo, :users, session, :votes, methods)
    params
  end
end
