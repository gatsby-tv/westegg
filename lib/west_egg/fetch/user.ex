defmodule WestEgg.Fetch.User do
  use WestEgg.Fetch,
    prefix: "user",
    sigil: "@",
    bucket: :users

  @impl true
  def authorized?(conn, %{id: id}), do: Auth.verified?(conn, as: id)

  public :users, [
    "profile",
    "preferences",
    "photo"
  ]

  private :secrets, [
    "contact_info",
    "payment_info",
    "history"
  ]
end
