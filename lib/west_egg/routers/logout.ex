defmodule WestEgg.Routers.Logout do
  @moduledoc """
  Router for handling logouts.
  """

  use Plug.Router

  plug :match
  plug :dispatch

  post "/" do
    conn
    |> configure_session(drop: true)
    |> send_resp(:ok, "")
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
