defmodule WestEgg.Query do
  defmacro query(type, query) do
    quote do
      def query(unquote(type)) do
        Xandra.prepare!(:xandra, unquote(query))
      end
    end
  end
end
