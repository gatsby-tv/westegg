defmodule WestEgg do
  use Plug.Router
  use Plug.ErrorHandler

  def handle_errors(conn, %{reason: reason}) do
    case reason do
      %ArgumentError{} ->
        send_resp(conn, :bad_request, "bad request")

      %Plug.Parsers.UnsupportedMediaTypeError{} ->
        send_resp(conn, :unsupported_media_type, "unsupported media type")

      _ ->
        send_resp(conn, :internal_server_error, "internal server error")
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

  forward "/login", to: WestEgg.Routers.Login

  forward "/users", to: WestEgg.Routers.Users
  forward "/channels", to: WestEgg.Routers.Channels
  forward "/shows", to: WestEgg.Routers.Shows
  forward "/videos", to: WestEgg.Routers.Videos

  match _, do: send_resp(conn, :not_found, "unknown request")
end
