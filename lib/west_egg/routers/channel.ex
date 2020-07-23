defmodule WestEgg.Routers.Channel do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/channel_:id/:request", to: Info.ChannelInfo, init_opts: [access: :public]
  get "/:handle/:request", to: Info.ChannelInfo, init_opts: [access: :public]
end
