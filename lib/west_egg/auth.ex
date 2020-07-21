defmodule WestEgg.Auth do
  defmodule InvalidSessionError do
    defexception message: "session was created without necessary data"
  end

  defmodule AuthenticationError do
    defexception message: "invalid login attempt"
  end

  defmodule AuthorizationError do
    defexception message: "unauthorized"
  end
end
