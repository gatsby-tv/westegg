defmodule WestEgg do
  @moduledoc """
  WestEgg: the place where Gatsby lives.

  WestEgg is the backend HTTP API for interfacing with
  the Gatsby database and analytics server.
  """

  use Plug.Router
  use Plug.ErrorHandler

  alias WestEgg.{Auth, Fetch, Modify, Register, Routers}

  def handle_errors(conn, %{reason: reason}) do
    case reason do
      %Modify.ModificationError{} -> send_resp(conn, :bad_request, reason.message)
      %Register.RegistrationError{} -> send_resp(conn, :bad_request, reason.message)
      %Auth.AuthorizationError{} -> send_resp(conn, :forbidden, reason.message)
      %Auth.AuthenticationError{} -> send_resp(conn, :forbidden, reason.message)
      %Fetch.AccessError{} -> send_resp(conn, :not_found, reason.message)
      _ -> send_resp(conn, :internal_server_error, "internal server error")
    end
  end

  plug Plug.Logger

  plug Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: Poison

  # NOTE: session cookies are currently persistent.
  plug Plug.Session,
    store: Auth.Sessions,
    key: "_sid",
    http_only: true

  plug :fetch_session
  plug :match
  plug :dispatch

  forward "/login", to: Routers.Login
  forward "/logout", to: Routers.Logout

  forward "/user", to: Routers.User
  forward "/channel", to: Routers.Channel
  forward "/show", to: Routers.Show
  forward "/video", to: Routers.Video

  forward "/secure/user", to: Routers.Secure.User
  forward "/secure/channel", to: Routers.Secure.Channel

  forward "/modify", to: Routers.Modify
  forward "/register", to: Routers.Register

  match _, do: send_resp(conn, :not_found, "unknown request")
end
