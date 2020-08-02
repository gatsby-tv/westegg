defmodule WestEgg.Modify.Comments do
  use WestEgg.Modify,
    spec: [
      video: {:required, [:add]},
      content: {:required, [:add, :edit]},
      comment: {:required, [:edit, :remove]},
      parent: {:optional, [:add]},
      author: :phantom,
      session: :phantom,
      has_liked?: :phantom,
      has_disliked?: :phantom
    ],
    ops: [:add, :edit, :remove, :like, :dislike]

  @impl true
  def modify(:add, conn, params, _opts) do
    params
    |> Map.put(:author, get_session(conn, "user"))
    |> Map.put(:comment, Repo.new_id(:comment))
    |> fetch(:video)
    |> authorize(:add, conn)
    |> validate(:content)
    |> validate(:parent)
    |> stage(:add, :profile)
    |> stage(:add, :content)
    |> stage(:add, :author)
    |> stage(:add, :video)
    |> finish(conn)
  end

  @impl true
  def modify(:edit, conn, params, _opts) do
    params
    |> fetch(:author)
    |> authorize(:edit, conn)
    |> validate(:content)
    |> stage(:edit, :content)
    |> finish(conn)
  end

  @impl true
  def modify(:remove, conn, params, _opts) do
    params
    |> fetch(:author)
    |> authorize(:remove, conn)
    |> stage(:remove, :profile)
    |> stage(:remove, :content)
    |> stage(:remove, :author)
    |> stage(:remove, :video)
    |> finish(conn)
  end

  @impl true
  def modify(:like, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> fetch(:author)
    |> fetch(:has_disliked?)
    |> authorize(:like, conn)
    |> stage(:like, :likes)
    |> stage(:like, :dislikes)
    |> stage(:like, :session)
    |> finish(conn)
  end

  @impl true
  def modify(:dislike, conn, params, _opts) do
    params
    |> Map.put(:session, get_session(conn, "user"))
    |> fetch(:author)
    |> fetch(:has_liked?)
    |> authorize(:dislike, conn)
    |> stage(:dislike, :dislikes)
    |> stage(:dislike, :likes)
    |> stage(:dislike, :session)
    |> finish(conn)
  end

  defp fetch(%{video: video} = params, :video) do
    case Repo.lookup(:repo, :video, video) do
      {:ok, id} -> Map.put(params, :video, id)
      {:error, %Repo.NotFoundError{}} -> fail("video not found")
      {:error, reason} -> raise reason
    end
  end

  defp fetch(%{comment: comment} = params, :author) do
    case Repo.fetch(:repo, :comments, comment, :profile) do
      {:ok, %{"author" => author}} -> Map.put(params, :author, author)
      {:error, %Repo.NotFoundError{}} -> fail("comment not found")
      {:error, reason} -> raise reason
    end
  end

  defp fetch(%{session: session, comment: comment} = params, :has_liked?) do
    case Repo.fetch(:repo, :comments, comment, session) do
      {:ok, %{"has_disliked?" => true}} -> fail("user has already disliked")
      {:ok, %{"has_liked?" => has_liked?}} -> Map.put(params, :has_liked?, has_liked?)
      {:ok, _} -> Map.put(params, :has_liked?, false)
      {:error, %Repo.NotFoundError{}} -> Map.put(params, :has_liked?, false)
      {:error, reason} -> raise reason
    end
  end

  defp fetch(%{session: session, comment: comment} = params, :has_disliked?) do
    case Repo.fetch(:repo, :comments, comment, session) do
      {:ok, %{"has_liked?" => true}} -> fail("user has already liked")
      {:ok, %{"has_disliked?" => has_disliked?}} -> Map.put(params, :has_disliked?, has_disliked?)
      {:ok, _} -> Map.put(params, :has_disliked?, false)
      {:error, %Repo.NotFoundError{}} -> Map.put(params, :has_disliked?, false)
      {:error, reason} -> raise reason
    end
  end

  defp authorize(params, :add, conn) do
    if Auth.verified?(conn), do: params, else: raise(Auth.AuthorizationError)
  end

  defp authorize(%{author: author} = params, op, conn) when op in [:edit, :remove] do
    if Auth.verified?(conn, as: author), do: params, else: raise(Auth.AuthorizationError)
  end

  defp authorize(%{author: author, session: session} = params, op, conn) when op in [:like, :dislike] do
    cond do
      not Auth.verified?(conn) -> raise Auth.AuthorizationError
      author == session -> fail("cannot rate comment authored by user")
      true -> params
    end
  end

  defp validate(%{content: content} = params, :content) do
    cond do
      String.length(content) == 0 -> fail("comment cannot be empty")
      String.length(content) > 10000 -> fail("comment too long")
      true -> params
    end
  end

  defp validate(%{parent: nil} = params, :parent), do: params

  defp validate(%{parent: parent} = params, :parent) do
    case Repo.fetch(:repo, :comments, parent, :profile) do
      {:ok, _} -> params
      {:error, %Repo.NotFoundError{}} -> fail("could not find parent")
      {:error, reason} -> raise reason
    end
  end

  defp stage(params, :add, :profile) do
    %{comment: comment, author: author, video: video, parent: parent} = params
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "author" => Repo.set(author),
      "video" => Repo.set(video),
      "creation_time" => Repo.set(now)
    }

    methods =
      unless is_nil(parent), do: Map.put(methods, "parent", Repo.set(parent)), else: methods

    Repo.modify(:repo, :comments, comment, :profile, methods)
    params
  end

  defp stage(%{comment: comment, content: content} = params, :add, :content) do
    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "content" => Repo.set(content)
    }

    Repo.modify(:repo, :comments, comment, :content, methods)
    params
  end

  defp stage(%{author: author, comment: comment} = params, :add, :author) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "comments" => Repo.add_element(comment)
    }

    Repo.modify(:repo, :users, author, :comments, methods)
    params
  end

  defp stage(%{video: video, comment: comment} = params, :add, :video) do
    methods = %{
      "_type" => Repo.set("application/riak_set"),
      "comments" => Repo.add_element(comment)
    }

    Repo.modify(:repo, :videos, video, :comments, methods)
    params
  end

  defp stage(%{comment: comment, content: content} = params, :edit, :content) do
    now = DateTime.utc_now() |> DateTime.to_unix() |> to_string()

    methods = %{
      "content" => Repo.set(content),
      "last_edit" => Repo.set(now)
    }

    Repo.modify(:repo, :comments, comment, :content, methods)
    params
  end

  defp stage(%{comment: comment} = params, :remove, :profile) do
    Repo.drop(:repo, :comments, comment, :profile)
    params
  end

  defp stage(%{comment: comment} = params, :remove, :content) do
    Repo.drop(:repo, :comments, comment, :content)
    params
  end

  defp stage(%{author: author, comment: comment} = params, :remove, :author) do
    methods = %{"comments" => Repo.del_element(comment)}
    Repo.modify(:repo, :users, author, :comments, methods)
    params
  end

  defp stage(%{video: video, comment: comment} = params, :remove, :video) do
    methods = %{"comments" => Repo.del_element(comment)}
    Repo.modify(:repo, :videos, video, :comments, methods)
    params
  end

  defp stage(%{comment: comment} = params, :like, :likes) do
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "likes" => Repo.increment()
    }

    Repo.modify(:repo, :comments, comment, :likes, methods)
    params
  end

  defp stage(%{comment: comment, has_disliked?: true} = params, :like, :dislikes) do
    methods = %{"dislikes" => Repo.decrement()}
    Repo.modify(:repo, :comments, comment, :dislikes, methods)
    params
  end

  defp stage(params, :like, :dislikes), do: params

  defp stage(%{comment: comment} = params, :dislike, :dislikes) do
    methods = %{
      "_type" => Repo.set("application/riak_counter"),
      "dislikes" => Repo.increment()
    }

    Repo.modify(:repo, :comments, comment, :dislikes, methods)
    params
  end

  defp stage(%{comment: comment, has_liked?: true} = params, :dislike, :likes) do
    methods = %{"likes" => Repo.decrement()}
    Repo.modify(:repo, :comments, comment, :likes, methods)
    params
  end

  defp stage(params, :dislike, :likes), do: params

  defp stage(params, :like, :session) do
    %{session: session, comment: comment, has_disliked?: has_disliked?} = params

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "has_liked?" => Repo.enable()
    }

    methods =
      if has_disliked?, do: Map.put(methods, "has_disliked?", Repo.disable()), else: methods

    Repo.modify(:repo, :comments, comment, session, methods)
    params
  end

  defp stage(params, :dislike, :session) do
    %{session: session, comment: comment, has_liked?: has_liked?} = params

    methods = %{
      "_type" => Repo.set("application/riak_map"),
      "has_disliked?" => Repo.enable()
    }

    methods =
      if has_liked?, do: Map.put(methods, "has_liked?", Repo.disable()), else: methods

    Repo.modify(:repo, :comments, comment, session, methods)
    params
  end
end
