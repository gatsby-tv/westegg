defmodule WestEgg.Modify do
  @callback modify(atom, Plug.Conn.t(), any, Map.t()) :: Plug.Conn.t()

  defmodule ModificationError do
    defexception message: "invalid modification"
  end

  defmacro __using__(spec: spec, ops: ops) do
    quote do
      @behaviour WestEgg.Modify
      use Plug.Builder
      alias WestEgg.{Auth, Modify, Repo}

      @ops Enum.map(unquote(ops), &to_string/1)

      defmodule Parameters do
        defstruct Keyword.keys(unquote(spec))
      end

      @impl true
      def call(%{params: %{"op" => op}} = conn, opts) when op in @ops do
        params =
          conn.body_params
          |> Map.take(unquote(spec) |> Keyword.keys() |> Enum.map(&to_string/1))
          |> Map.to_list()
          |> Map.new(fn {key, value} -> {String.to_atom(key), value} end)
          |> (&struct(Parameters, &1)).()

        for {key, :required} <- unquote(spec) do
          if is_nil(Map.fetch!(params, key)), do: fail("missing key, '#{key}'")
        end

        modify(String.to_atom(op), conn, params, Map.new(opts))
      end

      @impl true
      def call(conn, _opts), do: send_resp(conn, :not_found, "unknown request")

      defp finish(_params, conn), do: send_resp(conn, :ok, "ok")

      defp fail, do: raise(Modify.ModificationError)
      defp fail(message), do: raise(Modify.ModificationError, message: message)

      defoverridable [finish: 2]
      defoverridable Modify
      defoverridable Plug
    end
  end
end
