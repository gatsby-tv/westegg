defmodule WestEgg.Routers.Secure.Channel do
  use Plug.Router
  alias WestEgg.Info

  plug :match
  plug :dispatch

  get "/:handle/:request" do
    content = Info.ChannelInfo.fetch!(:private, "##{handle}", request)

    with {:ok, json} <- Poison.encode(content) do
      conn
      |> put_resp_content_type("application/json")
      |>send_resp(:ok, json)
    else
      error -> raise error
    end
  end
end
