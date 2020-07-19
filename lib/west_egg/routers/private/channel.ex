defmodule WestEgg.Routers.Private.Channel do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/:handle/:request" do
    {resp, type} = Info.ChannelInfo.fetch!(:private, handle, request)
    put_resp_content_type(conn, type)
    send_resp(conn, :ok, resp)
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
