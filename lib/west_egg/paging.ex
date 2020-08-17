defmodule WestEgg.Paging do
  defmacro __using__([{:method, method} | opts]) do
    default_page_size = Keyword.get(opts, :default_page_size, 10)
    page_query = Keyword.get(opts, :page_query, :select)

    quote do
      def page(%__MODULE__{} = obj, opts \\ %{}) do
        decode_size = fn
          nil -> :pop
          size -> {size, String.to_integer(size)}
        end

        decode_state = fn
          nil -> :pop
          state -> {state, Base.url_decode64!(state)}
        end

        opts =
          opts
          |> Map.take(["page_size", "paging_state"])
          |> Keyword.new(&{String.to_atom(elem(&1, 0)), elem(&1, 1)})
          |> Keyword.get_and_update(:page_size, decode_size)
          |> elem(1)
          |> Keyword.put_new(:page_size, unquote(default_page_size))
          |> Keyword.get_and_update(:paging_state, decode_state)
          |> elem(1)

        with {:ok, result} <- unquote(method).(unquote(page_query), obj, opts) do
          state =
            case Base.url_encode64(result.paging_state || "") do
              "" -> nil
              binary -> binary
            end

          result = Enum.map(result, &__MODULE__.from_binary_map/1)
          {:ok, %{page: result, paging_state: state}}
        end
      end
    end
  end
end
