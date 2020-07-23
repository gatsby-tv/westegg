defmodule WestEgg.Fetch.Video do
  use WestEgg.Fetch,
    prefix: "video",
    sigil: "$",
    bucket: :videos

  @impl true
  def authorized?(conn, opts),
    do: Auth.verified?(conn) and Auth.owns?(conn, video: opts[:id])

  public :videos, [
    "profile",
    "thumbnail"
  ]
end
