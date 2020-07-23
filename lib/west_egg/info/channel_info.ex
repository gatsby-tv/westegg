defmodule WestEgg.Info.ChannelInfo do
  use WestEgg.Info,
    bucket: :channels,
    sigil: "#"

  public :channels, [
    "profile",
    "photo",
    "banner"
  ]
end
