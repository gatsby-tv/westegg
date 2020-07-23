defmodule WestEgg.Auth.Authenticate do
  use Plug.Builder
  alias WestEgg.{Repo, Auth}

  def call(conn, _opts) do
    with {:ok, register} <- Repo.fetch(:repo, :registry, :users, conn.body_params["user"]),
         {:ok, login_info} <- Repo.fetch(:repo, :secrets, register["id"], "login_info") do
      unless Argon2.verify_pass(conn.body_params["password"], login_info["password"]),
        do: raise(Auth.AuthenticationError)

      conn
      |> put_session("user", register["id"])
      # TODO: Change this to "password?" when 2FA is added.
      |> put_session("verified?", true)
    else
      {:error, %Repo.NotFoundError{}} -> raise Auth.AuthenticationError
      {:error, reason} -> raise reason
    end
  end
end
