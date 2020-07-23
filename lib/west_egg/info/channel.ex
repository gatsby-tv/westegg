defmodule WestEgg.Info.Channel do
  use WestEgg.Info,
    prefix: "channel",
    sigil: "#",
    bucket: :channels

  @impl true
  def authorized?(conn, opts),
    do: Auth.verified?(conn) and Auth.owns?(conn, channel: opts[:id])

  public :channels, [
    "profile",
    "photo",
    "banner"
  ]
end
