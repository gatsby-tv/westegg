defmodule WestEgg.Info.ShowInfo do
  use WestEgg.Info,
    bucket: :shows,
    sigil: "#"

  public :shows, [
    "profile",
    "thumbnail",
    "banner"
  ]
end
