defmodule WestEgg.Routers.Register.Channel do
  @moduledoc """
  Router for handling channel registration.
  """

  use Plug.Router
  alias WestEgg.Register

  plug :match
  plug :dispatch

  post "/", to: Register.Channel

  match _, do: send_resp(conn, :not_found, "unknown request")
end
