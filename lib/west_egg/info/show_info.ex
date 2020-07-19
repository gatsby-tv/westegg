defmodule WestEgg.Info.ShowInfo do
  use WestEgg.Info

  registry_id :shows

  public :shows, [
    "profile",
    "thumbnail",
    "banner"
  ]
end
