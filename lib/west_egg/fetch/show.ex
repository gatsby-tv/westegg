defmodule WestEgg.Fetch.Show do
  use WestEgg.Fetch,
    prefix: "show",
    sigil: "#",
    bucket: :shows

  @impl true
  def call(
        %{params: %{"channel" => channel, "show" => show, "request" => request}} = conn,
        access: type
      ) do
    case Repo.fetch(:repo, :registry, @bucket, "#{@sigil}#{channel}/#{show}") do
      {:ok, %{"id" => id}} ->
        fetch(type, conn, id, request)
        |> parse()
        |> finish(conn)

      {:error, reason} ->
        raise reason
    end
  end

  @impl true
  def authorized?(conn, %{id: id}),
    do: Auth.verified?(conn) and Auth.owns?(conn, show: id)

  public :shows, [
    "profile",
    "videos"
    #"thumbnail",
    #"banner"
  ]
end
