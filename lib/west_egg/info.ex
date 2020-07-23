defmodule WestEgg.Info do
  @moduledoc """
  Behaviour for requesting keys from the database.
  """

  defmodule InvalidAccessError do
    defexception message: "unknown request"
  end

  defmacro __using__([bucket: bucket, sigil: sigil]) do
    quote do
      import WestEgg.Info
      @before_compile WestEgg.Info

      @bucket unquote(bucket)
      @sigil unquote(sigil)

      def fetch(type, key, request) when type in [:public, :private] do
        try do
          if String.starts_with?(key, @sigil) do
            case WestEgg.Repo.fetch(:repo, :registry, @bucket, key) do
              {:ok, %{"id" => id}} -> do_fetch(type, id, request)
              error -> error
            end
          else
            do_fetch(type, key, request)
          end
        rescue
          FunctionClauseError -> {:error, WestEgg.Info.InvalidAccessError}
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
