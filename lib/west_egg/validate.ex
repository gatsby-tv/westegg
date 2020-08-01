defmodule WestEgg.Validate do
  @moduledoc """
  Utility module for validating various types of input.
  """

  alias WestEgg.Repo

  @spec password(String.t()) :: :ok | {:error, String.t()}
  @doc """
  Validate a password.

  Passwords are allowed to contain any sequence of characters that the user may like,
  however, there are limits on how long the password is allowed to be. Passwords
  shorter than 8 characters are assumed to be too simple to be valid, while passwords
  longer than 64 characters are considered both excessive and a potential DDoS attack.
  """
  def password(password) do
    cond do
      String.length(password) < 8 -> {:error, "password is too short"}
      String.length(password) > 64 -> {:error, "password is too long"}
      true -> :ok
    end
  end

  @spec email(String.t()) :: :ok | {:error, String.t()}
  @doc """
  Validate an email.

  This method only lexically validates emails rather than verifying that the email
  exists. Moreso, the process of validating the string is delegated to an external
  dependency (the regex for validating emails can get pretty crazy if you want it
  to handle edge cases).
  """
  def email(email) do
    cond do
      not EmailChecker.valid?(email, [EmailChecker.Check.Format]) -> {:error, "invalid email"}
      true -> :ok
    end
  end

  @spec handle(atom, String.t()) :: :ok | {:error, String.t()}
  @doc """
  Validate a handle depending on its type.

  Handles are short sequences of alphanumeric characters and hyphens that serve to
  identify an object, such as a user or channel, in a human readable format. The
  type of handle is determined by a single character sigil that is prefexed to the
  handle's content. These sigils are

      `@`: users
      `#`: channels
      `/`: shows
      `$`: videos

  Handles are meant to be globally unique, with the exception of shows. Handles for
  identifying shows are instead unique locally to the channel that the show belongs to.
  To capture this, the handle for the channel that owns a particular show is prefixed
  to the show's handle. So, for example, if a channel that goes by the handle "#campfire-tales"
  has a show that has the handle "/spooky-stories", then the globally unique handle for
  this show would formally be "#campfire-tales/spooky-stories".
  """
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

  @spec title(atom, String.t()) :: :ok | {:error, String.t()}
  @doc """
  Validate a title depending on its type.

  A title is a general term that is used to designate the colloquial name by which
  an object can be recognized. Separating the title from the handle allows users a great
  amount of flexibility with how their user account, channel, etc, can be identified by
  other users.
  """
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

  @spec description(atom, String.t()) :: :ok | {:error, String.t()}
  @doc """
  Validate a description depending on its type.

  A description is used to allow a deeper contextualization for a given object, providing
  the means for defining a summary of the objects goals and purpose, as well as other things
  that the object's audience might find useful.
  """
  def description(type, description) when type in [:user, :channel, :show, :video] do
    cond do
      String.length(description) == 0 -> {:error, "empty description"}
      String.length(description) > 1000 -> {:error, "description is too long"}
      true -> :ok
    end
  end

  @spec tags(atom, [String.t()]) :: :ok | {:error, String.t()}
  @doc """
  Validate a list of tags depending on its type.

  Tags are user provided sequences of alphanumeric characters that can identify an object
  quickly in search queries.
  """
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
