defmodule WestEgg.Info.VideoInfo do
  use WestEgg.Info

  registry_id :videos

  public :videos, [
    "profile",
    "thumbnail"
  ]
end
