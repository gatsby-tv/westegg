defmodule WestEgg.Routers.Modify do
  @moduledoc """
  Router for handling requests to modify/update data.
  """

  use Plug.Router
  alias WestEgg.Modify

  plug :match
  plug :dispatch

  post "/:op/follower", to: Modify.Followers
  post "/:op/subscriber", to: Modify.Subscribers
  post "/:op/promotion", to: Modify.Promotions
  post "/:op/votes", to: Modify.Votes

  post "/:op/handle", to: Modify.Handles
  post "/:op/title", to: Modify.Titles
  post "/:op/description", to: Modify.Descriptions

  post "/:op/comment", to: Modify.Comments

  match _, do: send_resp(conn, :not_found, "unknown request")
end
