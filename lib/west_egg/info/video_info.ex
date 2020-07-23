defmodule WestEgg.Info.VideoInfo do
  use WestEgg.Info,
    bucket: :videos,
    sigil: "$"

  public :videos, [
    "profile",
    "thumbnail"
  ]
end
