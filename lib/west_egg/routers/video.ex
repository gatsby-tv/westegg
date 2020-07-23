defmodule WestEgg.Routers.Video do
  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/video_:id/:request", to: Fetch.Video, init_opts: [access: :public]
  get "/:handle/:request", to: Fetch.Video, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
