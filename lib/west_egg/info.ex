defmodule WestEgg.Info do
  @moduledoc """
  Behaviour for requesting keys from the database.
  """

  defmodule InvalidAccessError do
    defexception message: "unknown request"
  end

  defmacro __using__(_opts) do
    quote do
      import WestEgg.Info
      @before_compile WestEgg.Info

      def fetch(type, handle, key) when type in [:public, :private] do
        try do
          do_fetch(type, handle, key)
        rescue
          FunctionClauseError -> {:error, WestEgg.Info.InvalidAccessError}
          reason -> raise reason
        end
      end

      def fetch!(type, handle, key) when type in [:public, :private] do
        case fetch(type, handle, key) do
          {:ok, result} -> result
          {:error, reason} -> raise reason
        end
      end
    end
  end

  defmacro __before_compile__(env) do
    unless Module.defines?(env.module, {:do_fetch, 3}) do
      raise "no keys are idd in module #{inspect(env.module)} using WestEgg.Info"
    end

    unless Module.defines?(env.module, {:registry_id, 0}) do
      raise "the registry id for module #{inspect(env.module)} using WestEgg.Info"
    end

    quote do
      import WestEgg.Info, only: []
    end
  end

  defmacro registry_id(name) when is_atom(name) do
    quote do
      def registry_id, do: unquote(name)
    end
  end

  defmacro public(type, keys) do
    quote do
      defp do_fetch(:public, handle, key) when key in unquote(keys) do
        with {:ok, map} <- WestEgg.Repo.fetch(:repo, :registry, registry_id(), handle) do
          WestEgg.Repo.fetch(:repo, unquote(type), map["id"], key)
        else
          error -> error
        end
      end
    end
  end

  defmacro private(type, keys) do
    quote do
      defp do_fetch(:private, handle, key) when key in unquote(keys) do
        with {:ok, map} <- WestEgg.Repo.fetch(:repo, :registry, registry_id(), handle) do
          WestEgg.Repo.fetch(:repo, unquote(type), map["id"], key)
        else
          error -> error
        end
      end
    end
  end
end
