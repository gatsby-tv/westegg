defmodule WestEgg.Routers.Register do
  @moduledoc """
  Router for handling requests to register objects.
  """

  use Plug.Router
  alias WestEgg.Register

  plug :match
  plug :dispatch

  post "/user", to: Register.User
  post "/channel", to: Register.Channel
  post "/show", to: Register.Show
  post "/video", to: Register.Video

  match _, do: send_resp(conn, :not_found, "unknown request")
end
