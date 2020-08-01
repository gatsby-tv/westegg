defmodule WestEgg.Routers.Channel do
  @moduledoc """
  Router for requesting channel data.
  """

  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/:handle/:request", to: Fetch.Channel, init_opts: [access: :public]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
