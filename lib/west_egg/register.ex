defmodule WestEgg.Register do
  @callback register(Plug.Conn.t, any, Keyword.t) :: Plug.Conn.t

  defmodule RegistrationError do
    defexception message: "invalid registration"
  end

  defmodule PermissionError do
    defexception message: "unauthorized"
  end

  defmacro __using__(opts) do
    [
      prefix: prefix,
      bucket: bucket,
      spec: spec,
    ] = opts

    quote do
      @behaviour Plug
      @behaviour WestEgg.Register
      import Plug.Conn
      alias WestEgg.{Register, Repo}

      defmodule Parameters do
        defstruct [:id, :channel_id, :show_id | Keyword.keys(unquote(spec))]
      end

      @impl true
      def init(opts), do: opts

      @impl true
      def call(conn, opts) do
        params =
          conn.body_params
          |> Map.take(Enum.map(Keyword.keys(unquote(spec)), &to_string/1))
          |> Map.to_list()
          |> Map.new(fn {key, value} -> {String.to_atom(key), value} end)
          |> (&struct(Parameters, &1)).()

        for {key, :required} <- unquote(spec) do
          if is_nil(Map.fetch(params, key)), do: fail("missing key, '#{key}'")
        end

        register(conn, params, opts)
      end

      defp stage(params, :registry) do
        unless Map.has_key?(params, :handle) do
          raise """
            modules using WestEgg.Register \
            and invoking stage(_, :registry) must require a handle\
          """
        end

        id =
          :crypto.strong_rand_bytes(16)
          |> Base.encode32(padding: false)
          |> String.downcase()
          |> (&"#{unquote(prefix)}_#{&1}").()

        methods = %{
          "id" => Repo.set(id),
          "in_use?" => Repo.enable()
        }

        Repo.modify(:repo, :registry, unquote(bucket), params.handle, methods)

        Map.put(params, :id, id)
      end

      defp finish(_params, conn), do: send_resp(conn, :ok, "ok")

      defp fail, do: raise Register.RegistrationError
      defp fail(message), do: raise Register.RegistrationError, message: message

      defoverridable [finish: 2]
      defoverridable Register
      defoverridable Plug
    end
  end
end
