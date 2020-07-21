defmodule WestEgg.Routers.Show do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/:channel_handle/:show_handle/:request" do
    handle = "#{channel_handle}/#{show_handle}"
    content = Info.ShowInfo.fetch!(:public, handle, request)

    with {:ok, json} <- Poison.encode(content) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, json)
    else
      error -> raise error
    end
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
