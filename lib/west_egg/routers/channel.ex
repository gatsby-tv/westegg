defmodule WestEgg.Routers.Channel do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  def fetch(conn, key, request) do
    content = Info.ChannelInfo.fetch!(:public, key, request)

    with {:ok, json} <- Poison.encode(content) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, json)
    else
      error -> raise error
    end
  end

  get "/channel_:id/:request", do: fetch(conn, "channel_#{id}", request)
  get "/:handle/:request", do: fetch(conn, "##{handle}", request)

  match _, do: send_resp(conn, :not_found, "unknown request")
end
