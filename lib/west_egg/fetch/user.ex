defmodule WestEgg.Fetch.User do
  use WestEgg.Fetch,
    sigil: "@",
    bucket: :user

  @impl true
  def authorized?(conn, %{id: id}), do: Auth.verified?(conn, as: id)

  public :users, [
    "profile",
    "videos",
    "shows",
    "channels",
    "followers"
  ]

  private :users, [
    "votes",
    "following",
    "subscriptions"
  ]

  private :secrets, [
    "contact_info"
  ]
end
