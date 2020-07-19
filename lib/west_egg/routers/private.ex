defmodule WestEgg.Routers.Private do
  @moduledoc """
  Wrapper for privately accessible routes.
  """

  use Plug.Router
  alias WestEgg.Routers.Private

  plug :match
  plug :dispatch

  forward "/user", to: Private.User
  forward "/channel", to: Private.Channel

  match _, do: send_resp(conn, :not_found, "unknown request")
end
