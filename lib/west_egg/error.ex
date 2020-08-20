defmodule WestEgg.Error do
  defexception [:code, :message]

  @impl true
  def exception([{:reason, :unauthorized} | opts]) do
    msg = "unauthorized"
    %__MODULE__{code: :unauthorized, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, :forbidden} | opts]) do
    msg = "forbidden"
    %__MODULE__{code: :forbidden, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:not_found, type, obj}} | opts]) do
    msg = if is_nil(obj), do: "#{type} not found", else: "#{type} #{obj} not found"
    %__MODULE__{code: :not_found, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:exists, type, obj}} | opts]) do
    msg = if is_nil(obj), do: "#{type} already exists", else: "#{type} #{obj} already exists"
    %__MODULE__{code: :conflict, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:conflict, type, _}} | opts]) do
    msg = "#{type} conflict"
    %__MODULE__{code: :conflict, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:too_long, type, _}} | opts]) do
    msg = "#{type} is too long"
    %__MODULE__{code: :unprocessable_entity, message: Keyword.get(opts, :message, msg)}
  end

  @impl true
  def exception([{:reason, {:malformed, type, _}} | opts]) do
    msg = "malformed #{type}"
    %__MODULE__{code: :unprocessable_entity, message: Keyword.get(opts, :message, msg)}
  end
end
