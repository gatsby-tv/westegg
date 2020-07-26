defmodule WestEgg.Routers.User do
  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/:handle/:request", to: Fetch.User, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
