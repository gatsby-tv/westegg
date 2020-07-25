defmodule WestEgg.Auth.Authenticate do
  use Plug.Builder
  alias WestEgg.{Repo, Auth}

  def call(%{body_params: %{"user" => user, "password" => password}} = conn, _opts) do
    with {:ok, id} <- Repo.lookup(:repo, :user, user),
         {:ok, %{"password" => hash}} <- Repo.fetch(:repo, :secrets, id, :login_info) do

      unless Argon2.verify_pass(password, hash), do: raise(Auth.AuthenticationError)

      conn
      |> put_session("user", id)
      # TODO: Change this to "password?" when 2FA is added.
      |> put_session("verified?", true)
      |> configure_session(renew: true)
      |> send_resp(:ok, "ok")
    else
      {:error, %Repo.NotFoundError{}} -> raise Auth.AuthenticationError
      {:error, reason} -> raise reason
    end
  end
end
