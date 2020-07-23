defmodule WestEgg.Info do
  @moduledoc """
  Behaviour for requesting keys from the database.
  """

  defmodule InvalidAccessError do
    defexception message: "unknown request"
  end

  defmacro __using__([prefix: prefix, sigil: sigil, bucket: bucket]) do
    quote do
      use Plug.Builder
      import WestEgg.Info
      @before_compile WestEgg.Info

      @prefix unquote(prefix)
      @sigil unquote(sigil)
      @bucket unquote(bucket)

      def call(%{params: %{"id" => id, "request" => request}} = conn, access: type) do
        content = fetch!(type, "#{@prefix}_#{id}", request)
        send_json_resp(conn, content)
      end

      def call(%{params: %{"handle" => handle, "request" => request}} = conn, access: type) do
        case WestEgg.Repo.fetch(:repo, :registry, @bucket, "#{@sigil}#{handle}") do
          {:ok, %{"id" => id}} ->
            content = fetch!(type, id, request)
            send_json_resp(conn, content)
          {:error, reason} -> raise reason
        end
      end

      defp send_json_resp(conn, content) do
        case Poison.encode(content) do
          {:ok, json} ->
            conn
            |> put_resp_content_type("application/json")
            |> send_resp(:ok, json)
          {:error, reason} -> raise reason
        end
      end

      def fetch(type, key, request) when type in [:public, :private] do
        try do
          do_fetch(type, key, request)
        rescue
          FunctionClauseError -> {:error, InvalidAccessError}
          error -> error
        end
      end

      def fetch!(type, key, request) when type in [:public, :private] do
        case fetch(type, key, request) do
          {:ok, result} -> result
          {:error, reason} -> raise reason
        end
      end
    end
  end

  defmacro __before_compile__(env) do
    unless Module.defines?(env.module, {:do_fetch, 3}) do
      raise "no keys are available in module #{inspect(env.module)} using WestEgg.Info"
    end

    quote do
      import WestEgg.Info, only: []
    end
  end

  defmacro public(type, keys) do
    quote do
      defp do_fetch(:public, id, key) when key in unquote(keys) do
        WestEgg.Repo.fetch(:repo, unquote(type), id, key)
      end
    end
  end

  defmacro private(type, keys) do
    quote do
      defp do_fetch(:private, id, key) when key in unquote(keys) do
        WestEgg.Repo.fetch(:repo, unquote(type), id, key)
      end
    end
  end
end
