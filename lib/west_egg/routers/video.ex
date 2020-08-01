defmodule WestEgg.Routers.Video do
  @moduledoc """
  Router for requesting video data.
  """

  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/:handle/:request", to: Fetch.Video, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
