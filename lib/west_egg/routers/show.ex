defmodule WestEgg.Routers.Show do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/show_:id/:request", to: Info.Show, init_opts: [access: :public]
  get "/:channel/:show/:request", to: Info.Show, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
