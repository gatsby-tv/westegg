defmodule WestEgg do
  use Plug.Router
  use Plug.ErrorHandler

  @unsupported_media_type %{
    code: :unsupported_media_type,
    message: "unsupported media type -- check API documentation"
  }

  #@bad_request %{
  #  code: :bad_request,
  #  message: "request missing essential parameters -- check API documentation"
  #}

  @internal_server_error %{
    code: :internal_server_error,
    message: "internal server error"
  }

  def handle_errors(conn, %{reason: reason}) do
    resp =
      case reason do
        #%WestEgg.Error{} -> Map.take(reason, [:message, :code])
        %Plug.Parsers.UnsupportedMediaTypeError{} -> @unsupported_media_type
        #%ArgumentError{} -> @bad_request
        _ -> @internal_server_error
      end

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(resp.code, Poison.encode!(%{error: resp}))
  end

  plug Plug.Logger

  plug Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: Poison

  #plug Plug.Session,
  #  store: WestEgg.Session,
  #  key: "_sid",
  #  http_only: true

  plug :fetch_session
  plug :match
  plug :dispatch

  #forward "/login", to: WestEgg.Routers.Login
  #forward "/users", to: WestEgg.Routers.Users
  #forward "/channels", to: WestEgg.Routers.Channels
  #forward "/shows", to: WestEgg.Routers.Shows
  #forward "/videos", to: WestEgg.Routers.Videos

  match _, do: send_resp(conn, :not_found, "unknown request")
end
