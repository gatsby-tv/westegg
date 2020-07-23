defmodule WestEgg.Routers.Login do
  @moduledoc """
  Router for handling login attempts.
  """

  use Plug.Router
  alias WestEgg.Auth

  plug :match
  plug :dispatch

  post "/", to: Auth.Authenticate

  match _, do: send_resp(conn, :not_found, "unknown request")
end
