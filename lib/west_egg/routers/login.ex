defmodule WestEgg.Routers.Login do
  use Plug.Router
  alias WestEgg.{Registry, Secrets}

  plug :match
  plug :dispatch

  post "/:handle" do
    ttl = Map.get(conn.body_params, "ttl", 604_800)

    with %{body_params: %{"password" => password}} <- conn,
         {:ok, %{id: id}} <- Registry.Handle.from_keywords(user: handle),
         {:ok, %{password: hash}} <- Secrets.login(:select, %Secrets.Login{id: id}),
         true <- Argon2.verify_pass(password, hash) do
      conn
      |> put_session("id", id)
      |> put_session("ttl", ttl)
      |> put_session("is_verified", true)
      |> configure_session(renew: true)
      |> send_resp(:ok, "ok")
    else
      _ -> send_resp(conn, :forbidden, "bad login")
    end
  end

  delete "/:handle" do
    conn
    |> configure_session(drop: true)
    |> send_resp(:ok, "ok")
  end

  match _, do: send_resp(conn, :not_found, "unknown request")
end
