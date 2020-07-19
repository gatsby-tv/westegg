defmodule WestEgg.Routers.Public.Show do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/:channel_handle/:show_handle/:request" do
    handle = "#{channel_handle}/#{show_handle}"
    {resp, type} = Info.ShowInfo.fetch!(:public, handle, request)
    put_resp_content_type(conn, type)
    send_resp(conn, :ok, resp)
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
