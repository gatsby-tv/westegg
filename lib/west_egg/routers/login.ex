defmodule WestEgg.Routers.Login do
  @moduledoc """
  Router for handling login attempts.
  """

  use Plug.Router
  alias WestEgg.Auth

  plug Auth.Authenticate
  plug :match
  plug :dispatch

  post "/" do
    conn
    |> configure_session(renew: true)
    |> send_resp(:ok, "ok")
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
