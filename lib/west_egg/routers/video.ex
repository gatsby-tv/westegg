defmodule WestEgg.Routers.Video do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  def fetch(conn, key, request) do
    content = Info.VideoInfo.fetch!(:public, key, request)

    with {:ok, json} <- Poison.encode(content) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, json)
    else
      {:error, reason} -> raise reason
    end
  end

  get "/video_:id/:request", do: fetch(conn, "video_#{id}", request)
  get "/:handle/:request", do: fetch(conn, "@#{handle}", request)

  match _, do: send_resp(conn, :not_found, "unknown request")
end
