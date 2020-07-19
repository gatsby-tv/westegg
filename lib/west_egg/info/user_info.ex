defmodule WestEgg.Info.UserInfo do
  use WestEgg.Info

  registry_id :users

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
