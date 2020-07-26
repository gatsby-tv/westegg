defmodule WestEgg.Fetch.Video do
  use WestEgg.Fetch,
    sigil: "$",
    bucket: :video

  @impl true
  def authorized?(conn, %{id: id}),
    do: Auth.verified?(conn) and Auth.owns?(conn, video: id)

  public :videos, [
    "profile",
    "promotions"
  ]
end
