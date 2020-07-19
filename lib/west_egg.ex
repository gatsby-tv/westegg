defmodule WestEgg do
  @moduledoc """
  WestEgg: the place where Gatsby lives.

  WestEgg is the backend HTTP API for interfacing with
  the Gatsby database and analytics server.
  """

  use Plug.Router
  use Plug.ErrorHandler

  alias WestEgg.Routers
  alias WestEgg.Auth

  def handle_errors(conn, %{reason: reason}) do
    case reason do
      %WestEgg.Repo.NotFoundError{} -> send_resp(conn, :not_found, reason.message)
      %WestEgg.Info.InvalidAccessError{} -> send_resp(conn, :not_found, reason.message)
      %Plug.BadRequestError{} -> send_resp(conn, :bad_request, reason.message)
      _ -> send_resp(conn, :internal_server_error, "internal server error")
    end
  end

  #plug CORSPlug
  plug Plug.Logger
  # NOTE: session cookies are currently persistent.
  #plug Plug.Session,
  #  store: Auth.Sessions,
  #  key: "_sid",
  #  http_only: true
  plug :match
  plug :dispatch

  forward "/login", to: Routers.Login
  forward "/private", to: Routers.Private
  forward "/user", to: Routers.Public.User
  forward "/channel", to: Routers.Public.Channel
  forward "/show", to: Routers.Public.Show
  forward "/video", to: Routers.Public.Video

  match _, do: send_resp(conn, :not_found, "unknown request")
end
