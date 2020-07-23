defmodule WestEgg.Routers.Register.Show do
  @moduledoc """
  Router for handling show registration.
  """

  use Plug.Router
  alias WestEgg.Register

  plug :match
  plug :dispatch

  post "/", to: Register.Show
end
