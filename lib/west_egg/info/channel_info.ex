defmodule WestEgg.Info.ChannelInfo do
  use WestEgg.Info

  registry_id :channels

  public :channels, [
    "profile",
    "photo",
    "banner"
  ]
end
