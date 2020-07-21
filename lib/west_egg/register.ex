defmodule WestEgg.Register do
  @behaviour Plug
  import Plug.Conn
  alias WestEgg.Repo

  defmodule RegistrationError do
    defexception message: "invalid registeration"
  end

  def init(opts), do: opts

  def call(conn, new: type), do: create(type, conn)

  def create(:user, conn) do
    unless valid?(:user, conn.body_params), do: raise RegistrationError

    id =
      :crypto.strong_rand_bytes(16)
      |> Base.encode32(padding: false)
      |> String.downcase()
      |> (&"user_#{&1}").()

    Map.put_new(conn.body_params, "id", id)
    |> register_id(:users)
    |> register_user(:login_info)
    |> register_user(:contact_info)
    |> register_user(:profile)

    conn
    |> put_session("user", id)
    |> put_session("password?", true)
  end

  def create(:channel, conn) do
    unless valid?(:channel, conn.body_params), do: raise RegistrationError

    id =
      :crypto.strong_rand_bytes(16)
      |> Base.encode32(padding: false)
      |> String.downcase()
      |> (&"channel_#{&1}").()

    Map.put_new(conn.body_params, "id", id)
    |> register_id(:channels)
    |> register_channel(:profile)
  end

  defp valid?(:user, %{"handle" => handle, "password" => password}) do
    cond do
      not valid?(:handle, :users, handle) -> false
      not valid?(:password, password) -> false
      true -> true
    end
  end

  defp valid?(:channel, %{
    "handle" => handle,
    "title" => title,
    "multihash" => hash,
    "description" => desc,
    "tags" => tags
  }) do
    cond do
      not valid?(:handle, :channels, handle) -> false
      not valid?(:title, title) -> false
      not valid?(:multihash, hash) -> false
      not valid?(:description, desc) -> false
      not valid?(:tags, tags) -> false
      true -> true
    end
  end

  defp valid?(:password, password) do
    cond do
      String.length(password) > 64 -> false
      String.length(password) < 8 -> false
      true -> true
    end
  end

  defp valid?(:title, title) do
    cond do
      String.length(title) > 128 -> false
      String.length(title) < 1 -> false
      true -> true
    end
  end

  defp valid?(:multihash, hash) do
    cond do
      not String.match?(hash, ~r/^[0-9A-HJ-NP-Za-km-z]+$/) -> false
      true -> true
    end
  end

  defp valid?(:description, desc) do
    cond do
      not String.length(desc) > 1000 -> false
      true -> true
    end
  end

  defp valid?(:tags, tags) do
    cond do
      not String.match?(tags, ~r/^[[:alnum:][:space:]-_]+(,[[:alnum:][:space:]-_])*$/) -> false
      true -> true
    end
  end

  defp valid?(:handle, bucket, handle) do
    with {:ok, register} <- Repo.fetch(:repo, :registry, bucket, handle) do
      not register["in_use?"]
    else
      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) > 24 -> false
          not String.match?(handle, ~r/^[[:alnum:]_]+$/) -> false
          true -> true
        end

      {:error, reason} -> raise reason
    end
  end

  defp register_id(%{"id" => id, "handle" => handle} = params, bucket) do
    methods = %{
      "id" => Repo.set(id),
      "in_use?" => Repo.enable()
    }
    Repo.modify(:repo, :registry, bucket, handle, methods)

    params
  end

  defp register_user(%{
    "id" => id,
    "password" => password,
    "email" => email
  } = params, :login_info)
  do
    hash = Argon2.add_hash(password)[:password_hash]
    methods = %{
      "email" => Repo.set(email),
      "password" => Repo.set(hash)
    }
    Repo.modify(:repo, :secrets, id, "login_info", methods)

    params
  end

  defp register_user(%{"id" => id, "email" => email} = params, :contact_info) do
    methods = %{
      "emails" => Repo.add_element(email)
    }
    Repo.modify(:repo, :secrets, id, "contact_info", methods)

    params
  end

  defp register_user(%{"id" => id, "handle" => handle} = params, :profile) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()
    methods = %{
      "handle" => Repo.set(handle),
      "creation_time" => Repo.set(now)
    }
    Repo.modify(:repo, :users, id, "profile", methods)

    params
  end

  def register_channel(%{
    "id" => id,
    "title" => title,
    "multihash" => hash,
    "description" => desc,
    "tags" => tags,
    "owners" => owners
  } = params, :profile)
  do
    owners = for owner <- String.split(owners, ",", trim: true), into: [] do
      with {:ok, register} <- Repo.fetch(:repo, :registry, :users, String.trim(owner)) do
        register["id"]
      else
        {:error, _} -> raise RegistrationError
      end
    end

    if length(owners) == 0, do: raise RegistrationError

    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()
    methods = %{
      "title" => Repo.set(title),
      "multihash" => Repo.set(hash),
      "description" => Repo.set(desc),
      "tags" => Repo.set(tags),
      "owners" => Repo.add_elements(owners),
      "upload_time" => Repo.set(now)
    }
    Repo.modify(:repo, :channels, id, "profile", methods)

    params
  end
end
