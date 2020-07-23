defmodule WestEgg.Routers.Channel do
  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/channel_:id/:request", to: Fetch.Channel, init_opts: [access: :public]
  get "/:handle/:request", to: Fetch.Channel, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
