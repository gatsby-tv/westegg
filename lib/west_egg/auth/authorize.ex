defmodule WestEgg.Auth.Authorize do
  @behaviour Plug
  import Plug.Conn
  alias WestEgg.{Auth, Repo}

  def init(opts), do: opts

  def call(conn, for: type, level: level) do
    handle = conn.path_info |> hd
    authorize(type, level, conn, handle)
  end

  def authorize(:user, level, conn, handle) do
    session = get_session(conn)

    with {:ok, register} <- Repo.fetch(:repo, :registry, :users, handle) do
      do_authorize(:user, level, conn, register, session)
    else
      {:error, %Repo.NotFoundError{}} -> fail()
      {:error, reason} -> raise reason
    end
  end

  defp do_authorize(:user, :verified, conn, register, session) do
    cond do
      not register["in_use?"] -> fail()
      session["user"] != register["id"] -> fail()
      is_nil(session["verified?"]) -> fail()
      true -> conn
    end
  end

  defp fail, do: raise Auth.AuthorizationError
end
