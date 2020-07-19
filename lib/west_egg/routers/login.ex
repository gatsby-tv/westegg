defmodule WestEgg.Routers.Login do
  @moduledoc """
  Router for handling login attempts.
  """

  use Plug.Router

  plug Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: Poison
  plug :match
  plug :dispatch

  post "/" do
    send_resp(conn, :no_content, "")
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
