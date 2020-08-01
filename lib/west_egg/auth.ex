defmodule WestEgg.Auth do
  @moduledoc """
  Utility module for evaluating the level of authorization of a user session.
  """

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

  @spec verified?(Plug.Conn.t(), Keyword.t()) :: boolean
  @doc """
  Test whether the user session is verified.

  NOTE: currently, verification is defined by having provided a password,
  however, later it will include 2FA as well.

  Optionally, a handle may be passed to this method to verify not only that
  the user session has validated with their password, but that the user has
  a specific identity. This variation is used in situations such as fetching
  secure data associated with a user.

  ## Examples

      iex> Auth.verified?(conn)
      true
      iex> Auth.verified?(conn, as: "@DougWalker")
      true
  """
  def verified?(conn, opts \\ [])

  def verified?(conn, as: handle) do
    case Repo.lookup(:repo, :user, handle) do
      {:ok, id} -> if verified?(conn), do: get_session(conn, "user") == id, else: false
      {:error, %Repo.NotFoundError{}} -> false
      {:error, reason} -> raise reason
    end
  end

  def verified?(conn, _opts) do
    get_session(conn, "verified?") || false
  end

  @spec owns?(Plug.Conn.t(), Keyword.t()) :: boolean
  @doc """
  Test whether the user session owns a specific object.

  ## Examples

      iex> Auth.owns?(conn, channel: "#ChannelAwesome")
      true
  """
  def owns?(conn, [{type, bucket}]) when type in @ownables do
    case Repo.fetch(:repo, "#{type}s", bucket, :owners) do
      {:ok, %{"owners" => owners}} -> get_session(conn, "user") in owners
      {:error, %Repo.NotFoundError{}} -> false
      {:error, reason} -> raise reason
    end
  end
end
