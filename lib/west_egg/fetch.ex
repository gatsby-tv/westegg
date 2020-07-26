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
        fetch(type, conn, "#{@prefix}_#{id}", request)
        |> parse()
        |> finish(conn)
      end

      @impl true
      def call(%{params: %{"handle" => handle, "request" => request}} = conn, access: type) do
        case Repo.fetch(:repo, :registry, @bucket, "#{@sigil}#{handle}") do
          {:ok, %{"id" => id}} ->
            fetch(type, conn, id, request)
            |> parse()
            |> finish(conn)

          {:error, %Repo.NotFoundError{}} ->
            raise AccessError

          {:error, reason} ->
            raise reason
        end
      end

      defp fetch(:private, conn, id, request) do
        unless authorized?(conn, %{id: id, request: request}),
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

      defp parse(content) do
        case Map.pop(content, "_type") do
          {nil, _} ->
            raise "undefined object"

          {"application/riak_map", content} ->
            {"application/riak_map", content}

          {type, content} ->
            content
            |> Map.to_list()
            |> hd()
            |> (fn {_, resp} -> {type, resp} end).()
        end
      end

      defp finish({"application/riak_map", content}, conn) do
        case Poison.encode(content) do
          {:ok, json} ->
            conn
            |> put_resp_content_type("application/json")
            |> send_resp(:ok, json)

          {:error, reason} ->
            raise reason
        end
      end

      defp finish({"application/riak_set", content}, conn) do
        case Poison.encode(content) do
          {:ok, json} ->
            conn
            |> put_resp_content_type("application/json")
            |> send_resp(:ok, json)

          {:error, reason} ->
            raise reason
        end
      end

      defp finish({"application/riak_counter", content}, conn) do
        conn
        |> put_resp_content_type("plain/text")
        |> send_resp(:ok, to_string(content))
      end

      defp finish({type, content}, conn) do
        conn
        |> put_resp_content_type(type)
        |> send_resp(:ok, to_string(content))
      end

      @impl true
      def authorized?(conn, opts \\ %{})
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
