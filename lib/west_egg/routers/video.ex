defmodule WestEgg.Routers.Video do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/video_:id/:request", to: Info.VideoInfo, init_opts: [access: :public]
  get "/:handle/:request", to: Info.VideoInfo, init_opts: [access: :public]
end
