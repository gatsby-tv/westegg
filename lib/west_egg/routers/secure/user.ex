defmodule WestEgg.Routers.Secure.User do
  use Plug.Router
  alias WestEgg.{Auth, Info}

  plug :match
  plug :dispatch

  get "/:handle/:request" do
    unless Auth.verified?(conn, as: "@#{handle}"), do: raise Auth.AuthorizationError
    send_resp(conn, :no_content, "")
  end
end
