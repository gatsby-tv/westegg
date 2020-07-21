defmodule WestEgg.Routers.Secure.User do
  use Plug.Router
  alias WestEgg.{Auth, Info}

  plug Auth.Authorize,
    for: :user,
    level: :verified
  plug :match
  plug :dispatch

  get "/:handle/:request" do
    content = Info.UserInfo.fetch!(:private, handle, request)

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
