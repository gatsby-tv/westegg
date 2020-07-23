defmodule WestEgg.Register.User do
  use WestEgg.Register,
    prefix: "user",
    bucket: :users,
    spec: [
      handle: :required,
      password: :required,
      email: :required
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> validate(:handle)
    |> validate(:password)
    |> validate(:email)
    |> stage(:registry)
    |> stage(:login_info)
    |> stage(:contact_info)
    |> stage(:profile)
    |> finish(conn)
  end

  defp validate(%{handle: handle} = params, :handle) do
    case Repo.fetch(:repo, :registry, :users, handle) do
      {:ok, %{"in_use?" => true}} ->
        fail("handle not available")

      {:ok, _} ->
        params

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> fail("empty handle")
          String.length(handle) > 25 -> fail("handle is too long")
          not String.match?(handle, ~r/^@[[:alnum:]\-]+$/) -> fail("malformed handle")
          true -> params
        end

      {:error, reason} ->
        raise reason
    end
  end

  defp validate(%{password: password} = params, :password) do
    cond do
      String.length(password) < 8 -> fail("password is too short")
      String.length(password) > 64 -> fail("password is too long")
      true -> params
    end
  end

  defp validate(%{email: email} = params, :email) do
    cond do
      not EmailChecker.valid?(email, [EmailChecker.Check.Format]) -> fail("invalid email")
      true -> params
    end
  end

  defp stage(%{id: id, password: password, email: email} = params, :login_info) do
    hash = Argon2.add_hash(password)[:password_hash]

    methods = %{
      "email" => Repo.set(email),
      "password" => Repo.set(hash)
    }

    Repo.modify(:repo, :secrets, id, :login_info, methods)

    params
  end

  defp stage(%{id: id, email: email} = params, :contact_info) do
    methods = %{"emails" => Repo.add_element(email)}
    Repo.modify(:repo, :secrets, id, :contact_info, methods)
    params
  end

  defp stage(%{id: id, handle: handle} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "handle" => Repo.set(handle),
      "creation_time" => Repo.set(now)
    }

    Repo.modify(:repo, :users, id, :profile, methods)

    params
  end

  defp finish(%{id: id}, conn) do
    conn
    |> put_session("user", id)
    # TODO: change this to "password?" when 2FA is added.
    |> put_session("verified?", true)
    |> configure_session(renew: true)
    |> send_resp(:ok, "ok")
  end
end
