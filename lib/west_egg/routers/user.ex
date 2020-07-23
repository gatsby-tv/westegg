defmodule WestEgg.Routers.User do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/user_:id/:request", to: Info.User, init_opts: [access: :public]
  get "/:handle/:request", to: Info.User, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
