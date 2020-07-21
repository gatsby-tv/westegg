defmodule WestEgg.Routers.User do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/:handle/:request" do
    content = Info.UserInfo.fetch!(:public, handle, request)

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
