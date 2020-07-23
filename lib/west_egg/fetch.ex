defmodule WestEgg.Fetch do
  @moduledoc """
  Behaviour for requesting keys from the database.
  """

  alias WestEgg.{Auth, Repo}

  @callback authorized?(Plug.Conn.t(), Keyword.t()) :: bool

  defmodule AccessError do
    defexception message: "unknown request"
  end

  defmacro __using__(prefix: prefix, sigil: sigil, bucket: bucket) do
    quote do
      use Plug.Builder
      import WestEgg.Fetch
      alias WestEgg.{Auth, Repo}

      @behaviour WestEgg.Fetch
      @before_compile WestEgg.Fetch

      @prefix unquote(prefix)
      @sigil unquote(sigil)
      @bucket unquote(bucket)

      @impl true
      def call(%{params: %{"id" => id, "request" => request}} = conn, access: type) do
        content = fetch(type, conn, "#{@prefix}_#{id}", request)
        send_json_resp(conn, content)
      end

      @impl true
      def call(%{params: %{"handle" => handle, "request" => request}} = conn, access: type) do
        case Repo.fetch(:repo, :registry, @bucket, "#{@sigil}#{handle}") do
          {:ok, %{"id" => id}} ->
            content = fetch(type, conn, id, request)
            send_json_resp(conn, content)

          {:error, reason} ->
            raise reason
        end
      end

      defp fetch(:private, conn, id, request) do
        unless authorized?(conn, id: id, request: request),
          do: raise(Auth.AuthorizationError)

        try do
          do_fetch(:private, id, request)
        rescue
          FunctionClauseError -> raise AccessError
        end
      end

      defp fetch(:public, _conn, id, request) do
        try do
          do_fetch(:public, id, request)
        rescue
          FunctionClauseError -> raise AccessError
        end
      end

      defp send_json_resp(conn, content) do
        case Poison.encode(content) do
          {:ok, json} ->
            conn
            |> put_resp_content_type("application/json")
            |> send_resp(:ok, json)

          {:error, reason} ->
            raise reason
        end
      end

      def authorized?(conn, opts \\ [])
      def authorized?(conn, _opts), do: Auth.verified?(conn)

      defoverridable WestEgg.Fetch
    end
  end

  defmacro __before_compile__(env) do
    unless Module.defines?(env.module, {:do_fetch, 3}) do
      raise "no keys are available in module #{inspect(env.module)} using WestEgg.Fetch"
    end

    quote do
      import WestEgg.Fetch, only: []
    end
  end

  defmacro public(type, keys) do
    quote do
      defp do_fetch(:public, id, key) when key in unquote(keys) do
        case Repo.fetch(:repo, unquote(type), id, key) do
          {:ok, content} -> content
          {:error, reason} -> raise reason
        end
      end
    end
  end

  defmacro private(type, keys) do
    quote do
      defp do_fetch(:private, id, key) when key in unquote(keys) do
        case Repo.fetch(:repo, unquote(type), id, key) do
          {:ok, content} -> content
          {:error, reason} -> raise reason
        end
      end
    end
  end
end
