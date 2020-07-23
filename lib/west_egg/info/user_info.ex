defmodule WestEgg.Info.UserInfo do
  use WestEgg.Info,
    prefix: "user",
    sigil: "@",
    bucket: :users

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
