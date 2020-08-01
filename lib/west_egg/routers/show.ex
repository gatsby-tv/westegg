defmodule WestEgg.Routers.Show do
  @moduledoc """
  Router for requesting show data.
  """

  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/:handle/:request", to: Fetch.Show, init_opts: [access: :public]
  get "/:channel/:show/:request", to: Fetch.Show, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
