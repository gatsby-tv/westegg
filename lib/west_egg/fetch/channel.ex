defmodule WestEgg.Fetch.Channel do
  use WestEgg.Fetch,
    prefix: "channel",
    sigil: "#",
    bucket: :channels

  @impl true
  def authorized?(conn, %{id: id}),
    do: Auth.verified?(conn) and Auth.owns?(conn, channel: id)

  public :channels, [
    "profile",
    "photo",
    "banner"
  ]
end
