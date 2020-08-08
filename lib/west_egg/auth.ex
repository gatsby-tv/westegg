defmodule WestEgg.Auth do
  import Plug.Conn
  alias WestEgg.{Registry, Secrets}

  @ownables [WestEgg.Channel, WestEgg.Show, WestEgg.Video]

  defmodule AuthorizationError do
    defexception message: "unauthorized"
  end

  def verify(conn, opts \\ []) do
    ttl = Keyword.get(opts, :ttl, 604_800)
    %{body_params: %{"id" => user, "password" => password}} = conn

    with {:ok, id} <- Registry.id(user),
         {:ok, %{"password" => hash}} <- Secrets.login(:select, %Secrets.Login{id: id}),
         true <- Argon2.verify_pass(password, hash) do
      conn
      |> put_session("id", id)
      |> put_session("is_verified", true)
      |> put_session("ttl", ttl)
      |> configure_session(renew: true)
      |> send_resp(:ok, "ok")
    else
      _ -> raise AuthorizationError
    end
  end

  def verified?(conn, opts \\ [])

  def verified?(conn, as: handle) do
    with true <- verified?(conn),
         {:ok, id} <- Registry.id(handle) do
      get_session(conn, "id") == id
    else
      _ -> false
    end
  end

  def verified?(conn, _opts) do
    get_session(conn, "is_verified") || false
  end

  def owns?(conn, type, id) when type in @ownables do
    owner =
      type
      |> Module.concat(Owner)
      |> struct(%{id: id, owner: get_session(conn, "id")})

    case type.owners(:select_one, owner) do
      {:ok, _} -> true
      _ -> false
    end
  end
end
