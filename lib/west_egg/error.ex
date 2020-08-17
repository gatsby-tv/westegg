defmodule WestEgg.Error do
  defexception [:code, :message]

  @impl true
  def exception([{:reason, :unauthorized} | opts]) do
    msg = "unauthorized"
    %__MODULE__{code: :unauthorized, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:not_found, type, {_, obj}}} | opts]) do
    msg = "#{type} #{obj} not found"
    %__MODULE__{code: :not_found, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:not_found, type, obj}} | opts]) do
    msg = "#{type} #{obj} not found"
    %__MODULE__{code: :not_found, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:exists, type, _}} | opts]) do
    msg = "#{to_string(type)} already exists"
    %__MODULE__{code: :conflict, message: Keyword.get(opts, :message, msg)}
  end
end
