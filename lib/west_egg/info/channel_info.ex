defmodule WestEgg.Info.ChannelInfo do
  use WestEgg.Info,
    prefix: "channel",
    sigil: "#",
    bucket: :channels

  public :channels, [
    "profile",
    "photo",
    "banner"
  ]
end
