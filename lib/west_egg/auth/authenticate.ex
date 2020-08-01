defmodule WestEgg.Auth.Authenticate do
  @moduledoc """
  Plug for validating a login attempt.

  Logins will be handled via a POST request whose body contains the
  user handle to login as and an associated password.

  This Plug is deliberately slow and rate limiting should be applied to prevent
  DDoS attacks. The slow performance is due to the choice of our password hashing
  algorithm, Argon2: https://en.wikipedia.org/wiki/Argon2.
  """

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
