defmodule WestEgg.Routers.Secure.User do
  use Plug.Router
  alias WestEgg.{Auth, Info}

  plug :match
  plug Auth.Authorize,
    for: :user,
    level: :verified
  plug :dispatch

  get "/:handle/:request" do
    content = Info.UserInfo.fetch!(:private, "@#{handle}", request)

    with {:ok, json} <- Poison.encode(content) do
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(:ok, json)
    else
      error -> raise error
    end
  end
end
