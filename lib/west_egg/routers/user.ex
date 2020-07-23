defmodule WestEgg.Routers.User do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/user_:id/:request", to: Info.UserInfo, init_opts: [access: :public]
  get "/:handle/:request", to: Info.UserInfo, init_opts: [access: :public]
end
