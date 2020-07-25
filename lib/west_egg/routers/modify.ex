defmodule WestEgg.Routers.Modify do
  use Plug.Router
  alias WestEgg.Modify

  plug :match
  plug :dispatch

  post "/add/follower", to: Modify.Followers, init_opts: [op: :add]
  post "/add/subscriber", to: Modify.Subscribers, init_opts: [op: :add]
  post "/add/promotion", to: Modify.Promotions, init_opts: [op: :add]

  post "/remove/follower", to: Modify.Followers, init_opts: [op: :remove]
  post "/remove/subscriber", to: Modify.Subscribers, init_opts: [op: :remove]
  post "/remove/promotion", to: Modify.Promotions, init_opts: [op: :remove]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
