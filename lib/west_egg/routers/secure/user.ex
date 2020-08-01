defmodule WestEgg.Routers.Secure.User do
  @moduledoc """
  Router for requesting secure channel data.
  """

  use Plug.Router
  alias WestEgg.Fetch

  plug :match
  plug :dispatch

  get "/:handle/:request", to: Fetch.User, init_opts: [access: :private]

  match _, do: send_resp(conn, :not_found, "unknown request")
end
