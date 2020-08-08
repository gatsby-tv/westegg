defmodule WestEgg do
  use Plug.Router
  use Plug.ErrorHandler

  def handle_errors(conn, %{reason: reason}) do
    case reason do
      _ -> send_resp(conn, :internal_server_error, "internal server error")
    end
  end

  plug Plug.Logger

  plug Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: Poison

  plug Plug.Session,
    store: WestEgg.Session,
    key: "_sid",
    http_only: true

  plug :fetch_session
  plug :match
  plug :dispatch

  match _, do: send_resp(conn, :not_found, "unknown request")
end
