defmodule WestEgg.Routers.Register.Video do
  @moduledoc """
  Router for handling video registration.
  """

  use Plug.Router
  alias WestEgg.Register

  plug :match
  plug :dispatch

  post "/", to: Register.Video

  match _, do: send_resp(conn, :not_found, "unknown request")
end
