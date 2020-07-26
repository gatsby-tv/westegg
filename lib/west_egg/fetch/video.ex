defmodule WestEgg.Fetch.Video do
  use WestEgg.Fetch,
    prefix: "video",
    sigil: "$",
    bucket: :videos

  @impl true
  def authorized?(conn, %{id: id}),
    do: Auth.verified?(conn) and Auth.owns?(conn, video: id)

  public :videos, [
    "profile",
    "promotions"
  ]
end
