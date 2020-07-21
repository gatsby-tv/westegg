defmodule WestEgg.Routers.Register.User do
  @moduledoc """
  Router for handling user account creation.
  """

  use Plug.Router
  alias WestEgg.Register

  plug Register, new: :user
  plug :match
  plug :dispatch

  post "/", do: send_resp(conn, :ok, "")

  match _, do: send_resp(conn, :not_found, "unknown request")
end
