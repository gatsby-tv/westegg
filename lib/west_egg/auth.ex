defmodule WestEgg.Auth do
  import Plug.Conn

  @ownables [WestEgg.Channel, WestEgg.Show, WestEgg.Video]

  def verified?(conn, opts \\ [])

  def verified?(conn, as: id) do
    with :ok <- verified?(conn),
         true <- get_session(conn, "id") == id do
      :ok
    else
      _ -> {:error, :unauthorized}
    end
  end

  def verified?(conn, _opts) do
    cond do
      get_session(conn, "is_verified") -> :ok
      true -> {:error, :unauthorized}
    end
  end

  def owns?(conn, type, id) when type in @ownables do
    owner =
      type
      |> Module.concat(Owner)
      |> struct(%{id: id, owner: get_session(conn, "id")})

    case type.owners(:select_one, owner) do
      {:ok, _} -> :ok
      _ -> {:error, :unauthorized}
    end
  end
end
