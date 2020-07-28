defmodule WestEgg.Register.User do
  use WestEgg.Register,
    prefix: "user",
    bucket: :users,
    spec: [
      handle: :required,
      title: :required,
      password: :required,
      email: :required
    ]

  @impl true
  def register(conn, params, _opts) do
    params
    |> validate(:handle)
    |> validate(:title)
    |> validate(:password)
    |> validate(:email)
    |> stage(:registry)
    |> stage(:login_info)
    |> stage(:contact_info)
    |> stage(:profile)
    |> finish(conn)
  end

  defp validate(%{handle: handle} = params, :handle) do
    case Validate.handle(:user, handle) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp validate(%{title: title} = params, :title) do
    case Validate.title(:user, title) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp validate(%{password: password} = params, :password) do
    case Validate.password(password) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp validate(%{email: email} = params, :email) do
    case Validate.email(email) do
      :ok -> params
      {:error, reason} -> fail(reason)
    end
  end

  defp stage(%{id: id, password: password, email: email} = params, :login_info) do
    hash = Argon2.add_hash(password)[:password_hash]

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "email" => Repo.set(email),
      "password" => Repo.set(hash)
    }

    Repo.modify(:repo, :secrets, id, :login_info, methods)
    params
  end

  defp stage(%{id: id, email: email} = params, :contact_info) do
    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "emails" => Repo.add_element(email)
    }

    Repo.modify(:repo, :secrets, id, :contact_info, methods)
    params
  end

  defp stage(%{id: id, handle: handle, title: title} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "title" => Repo.set(title),
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
