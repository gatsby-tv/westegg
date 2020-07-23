defmodule WestEgg.Routers.Register.User do
  @moduledoc """
  Router for handling user account creation.
  """

  use Plug.Router
  alias WestEgg.Register

  plug :match
  plug :dispatch

  post "/", to: Register.User
end
