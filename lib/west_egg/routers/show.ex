defmodule WestEgg.Routers.Show do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  def fetch(conn, key, request) do
    content = Info.ShowInfo.fetch!(:public, key, request)

    with {:ok, json} <- Poison.encode(content) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, json)
    else
      {:error, reason} -> raise reason
    end
  end

  get "/show_:id/:request", do: fetch(conn, "show_#{id}", request)
  get "/:channel/:show/:request", do: fetch(conn, "##{channel}/#{show}", request)

  match _, do: send_resp(conn, :not_found, "unknown request")
end
