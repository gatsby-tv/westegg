defmodule WestEgg.Routers.Private.User do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/:handle/:request" do
    {resp, type} = Info.UserInfo.fetch!(:private, handle, request)
    put_resp_content_type(conn, type)
    send_resp(conn, :ok, resp)
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
