defmodule WestEgg.Validate do
  alias WestEgg.Repo

  def password(password) do
    cond do
      String.length(password) < 8 -> {:error, "password is too short"}
      String.length(password) > 64 -> {:error, "password is too long"}
      true -> :ok
    end
  end

  def email(email) do
    cond do
      not EmailChecker.valid?(email, [EmailChecker.Check.Format]) -> {:error, "invalid email"}
      true -> :ok
    end
  end

  def handle(:user, handle) do
    case Repo.fetch(:repo, :registry, :users, handle) do
      {:ok, %{"in_use?" => true}} ->
        {:error, "handle not available"}

      {:ok, _} ->
        :ok

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> {:error, "empty handle"}
          String.length(handle) > 25 -> {:error, "handle is too long"}
          not String.match?(handle, ~r/^@[[:alnum:]\-]+$/) -> {:error, "malformed handle"}
          true -> :ok
        end

      {:error, reason} ->
        raise reason
    end
  end

  def handle(:channel, handle) do
    case Repo.fetch(:repo, :registry, :channels, handle) do
      {:ok, %{"in_use?" => true}} ->
        {:error, "handle not available"}

      {:ok, _} ->
        :ok

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> {:error, "empty handle"}
          String.length(handle) > 25 -> {:error, "handle is too long"}
          not String.match?(handle, ~r/^#[[:alnum:]\-]+$/) -> {:error, "malformed handle"}
          true -> :ok
        end

      {:error, reason} ->
        raise reason
    end
  end

  def handle(:show, {channel, handle}) do
    case Repo.fetch(:repo, :registry, :shows, "#{channel}#{handle}") do
      {:ok, %{"in_use?" => true}} ->
        {:error, "show already exists"}

      {:ok, _} ->
        :ok

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> {:error, "empty handle"}
          String.length(handle) > 25 -> {:error, "handle is too long"}
          not String.match?(handle, ~r/^\/[[:alnum:]\-]+$/) -> {:error, "malformed handle"}
          true -> :ok
        end

      {:error, reason} ->
        raise reason
    end
  end

  def handle(:video, handle) do
    case Repo.fetch(:repo, :registry, :videos, handle) do
      {:ok, %{"in_use?" => true}} ->
        {:error, "video already exists"}

      {:ok, _} ->
        :ok

      {:error, %Repo.NotFoundError{}} ->
        cond do
          String.length(handle) == 0 -> {:error, "empty handle"}
          not String.match?(handle, ~r/^\$[0-9A-HJ-NP-Za-km-z]+$/) -> {:error, "malformed handle"}
          true -> :ok
        end

      {:error, reason} ->
        raise reason
    end
  end

  def title(type, title) when type in [:user, :channel, :show] do
    cond do
      String.length(title) == 0 -> {:error, "empty display name"}
      String.length(title) > 64 -> {:error, "display name is too long"}
      true -> :ok
    end
  end

  def title(:video, title) do
    cond do
      String.length(title) == 0 -> {:error, "empty title"}
      String.length(title) > 128 -> {:error, "title is too long"}
      true -> :ok
    end
  end

  def description(type, description) when type in [:user, :channel, :show, :video] do
    cond do
      String.length(description) == 0 -> {:error, "empty description"}
      String.length(description) > 1000 -> {:error, "description is too long"}
      true -> :ok
    end
  end

  def tags(type, tags) when type in [:user, :channel, :show, :video] do
    Enum.reduce_while(tags, :ok, fn tag, _ -> 
      cond do
        not String.match?(tag, ~r/^[[:alnum:]\-\_][[:alnum:][:space:]\-\_]*$/) ->
          {:halt, {:error, "malformed tag, '#{tag}'"}}

        true ->
          {:cont, :ok}
      end
    end)
  end
end
