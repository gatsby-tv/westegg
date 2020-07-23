defmodule WestEgg.Routers.Register.Video do
  @moduledoc """
  Router for handling video registration.
  """

  use Plug.Router
  alias WestEgg.Register

  plug :match
  plug :dispatch

  post "/", to: Register.Video
end
