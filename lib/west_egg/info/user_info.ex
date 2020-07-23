defmodule WestEgg.Info.UserInfo do
  use WestEgg.Info,
    bucket: :users,
    sigil: "@"

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
