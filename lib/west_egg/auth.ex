defmodule WestEgg.Auth do
  import Plug.Conn
  alias WestEgg.Repo

  @ownables [:channel, :show, :video]

  defmodule InvalidSessionError do
    defexception message: "session was created without necessary data"
  end

  defmodule AuthenticationError do
    defexception message: "invalid login attempt"
  end

  defmodule AuthorizationError do
    defexception message: "unauthorized"
  end

  def verified?(conn, opts \\ [])

  def verified?(conn, as: handle) do
    if String.starts_with?(handle, "@") do
      case Repo.fetch(:repo, :registry, :users, handle) do
        {:ok, %{"id" => id}} ->
          if verified?(conn), do: get_session(conn, "user") == id, else: false
        {:error, %Repo.NotFoundError{}} -> false
        {:error, reason} -> raise reason
      end
    else
      if verified?(conn), do: get_session(conn, "user") == handle, else: false
    end
  end

  def verified?(conn, _opts) do
    get_session(conn, "verified?")
  end

  def owns?(conn, [{type, bucket}]) when type in @ownables do
    case Repo.fetch(:repo, "#{type}s", bucket, :profile) do
      {:ok, %{"owners" => owners}} -> get_session(conn, "user") in owners
      {:error, %Repo.NotFoundError{}} -> false
      {:error, reason} -> raise reason
    end
  end
end
