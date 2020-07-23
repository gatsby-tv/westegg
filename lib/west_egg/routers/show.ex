defmodule WestEgg.Routers.Show do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/show_:id/:request", to: Info.ShowInfo, init_opts: [access: :public]
  get "/:channel/:show/:request", to: Info.ShowInfo, init_opts: [access: :public]
end
