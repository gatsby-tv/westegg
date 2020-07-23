defmodule WestEgg.Info.ShowInfo do
  use WestEgg.Info,
    prefix: "show",
    sigil: "#",
    bucket: :shows

  def call(
    %{params: %{"channel" => channel, "show" => show, "request" => request}} = conn,
    access: type
  ) do
    case WestEgg.Repo.fetch(:repo, :registry, @bucket, "#{@sigil}#{channel}/#{show}") do
      {:ok, %{"id" => id}} ->
        content = fetch!(type, id, request)
        send_json_resp(conn, content)
      {:error, reason} -> raise reason
    end
  end

  public :shows, [
    "profile",
    "thumbnail",
    "banner"
  ]
end
