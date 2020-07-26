defmodule WestEgg.Fetch.Show do
  use WestEgg.Fetch,
    sigil: "#",
    bucket: :show

  @impl true
  def call(
        %{params: %{"channel" => channel, "show" => show, "request" => request}} = conn,
        access: type
      ) do
    handle = "#{@sigil}#{channel}/#{show}"

    case Repo.lookup(:repo, @bucket, handle) do
      {:ok, id} ->
        fetch(type, conn, id, request)
        |> parse()
        |> finish(conn)

      {:error, %Repo.NotFoundError{}} ->
        raise Fetch.AccessError, "key '#{handle}' does not exist"

      {:error, reason} ->
        raise reason
    end
  end

  @impl true
  def authorized?(conn, %{id: id}),
    do: Auth.verified?(conn) and Auth.owns?(conn, show: id)

  public :shows, [
    "profile",
    "owners",
    "videos"
  ]
end
