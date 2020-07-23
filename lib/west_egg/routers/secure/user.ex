defmodule WestEgg.Routers.Secure.User do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/user_:id/:request", to: Info.User, init_opts: [access: :private]
  get "/:handle/:request", to: Info.User, init_opts: [access: :private]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
