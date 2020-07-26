defmodule WestEgg.Fetch.User do
  use WestEgg.Fetch,
    prefix: "user",
    sigil: "@",
    bucket: :users

  @impl true
  def authorized?(conn, %{id: id}), do: Auth.verified?(conn, as: id)

  public :users, [
    "profile",
    "videos",
    "shows",
    "channels",
    "followers"
  ]

  private :secrets, [
    "contact_info",
    "votes",
    "following",
    "subscriptions"
  ]
end
