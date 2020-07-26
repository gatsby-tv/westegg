defmodule WestEgg.Routers.Secure.Channel do
  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/:handle/:request", to: Fetch.Channel, init_opts: [access: :private]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
