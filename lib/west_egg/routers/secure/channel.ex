defmodule WestEgg.Routers.Secure.Channel do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/channel_:id/:request", to: Info.Channel, init_opts: [access: :private]
  get "/:handle/:request", to: Info.Channel, init_opts: [access: :private]
end
