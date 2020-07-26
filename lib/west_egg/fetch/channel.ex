defmodule WestEgg.Fetch.Channel do
  use WestEgg.Fetch,
    sigil: "#",
    bucket: :channel

  @impl true
  def authorized?(conn, %{id: id}),
    do: Auth.verified?(conn) and Auth.owns?(conn, channel: id)

  public :channels, [
    "profile",
    "owners",
    "videos",
    "shows",
    "subscribers"
  ]
end
