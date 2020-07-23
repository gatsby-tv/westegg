defmodule WestEgg.Info.VideoInfo do
  use WestEgg.Info,
    prefix: "video",
    sigil: "$",
    bucket: :videos

  public :videos, [
    "profile",
    "thumbnail"
  ]
end
