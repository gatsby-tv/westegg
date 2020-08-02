defmodule WestEgg.Repo do
  @moduledoc """
  Module for interfacing with the Riak database.

  Riak is a key-value, NoSQL database designed for high availability and scalability.
  As such, we must be careful to create a consistent, and extensible naming scheme for
  the keys by which objects will be stored.

  Keys in Riak are defined via three namespaces: bucket-types, buckets, and keys.
  A bucket-type, is the highest namespace and is how different Riak properties are
  defined for any object contained within. These properties range from security type
  properties to specifically configured storage backends.

  Buckets are a namespace for categorizing different sets of keys. In our use case,
  these buckets will often be used to specify the specific user, channel, show, etc.

  Keys are going to represent different groups of data associated with the given bucket.
  So, for instance, if we have the bucket-type "users", and a bucket "user_1234", then
  we might have a key "profile" that contains information such as the user's handle and
  display name.

  It is important that objects that we expect to be mutable and frequently updated are
  kept separated into different keys. This is because Riak is a distributed, eventually
  consistent database and managing conflicts between different instances of data (or
  siblings as Riak likes call them) can become cumbersome.

  Unlike buckets and keys, bucket-types cannot be defined ad hoc. They can only be created
  by directly interfacing with the database either via the command line, or via Riak's HTTP
  API (there is also the Web Interface that Riak provides as well).

  The bucket-types defined for our database are listed as follows:

    registry:
      bucket pattern: "users" | "channels" | "shows" | "videos"
      key pattern: handles
      Dictionary like bucket-type for mapping handles such as "@MrUser" to ids such as
      "user_5bfg6od7dp4xww4fjffjvhsnvi". Information regarding whether the handle is in
      use or not is also recorded here so that handles that have been changed may be recycled.
      All ids will be prefixed with the singular version of the bucket they belong to followed
      by a single underscore. The characters that follow will be randomly generated upon the
      objects creation.

    sessions:
      bucket pattern: "users"
      key pattern: session ids
      Keys stored in sessions record information regarding cookies that have been registered
      via Plug's session store API. This information is also used frequently for authorization
      to check whether the session has been verified and to retrieve the identity of the user
      that the session belongs to.

    secrets:
      bucket pattern: user ids
      Stores sensitive user information such as password hashes, contact information, and
      payment information.

    users:
      bucket pattern: user ids
      Stores keys relating to user data such as the user's profile, their number of followers,
      the list of users they are following and channels they are subscribed to, etc.

    channels:
      bucket pattern: channel ids
      Stores keys relating to channel data such as the channel's profile, their number of
      subscribers, and the list of owners of the channel, etc.

    shows:
      bucket pattern: show ids
      Stores keys relating to show data such as the show's profile, the list of videos
      the show is comprised of, the list of owners of the show, etc.

    videos:
      bucket pattern: video ids
      Stores keys relating to video data such as the video's profile, the number of views
      the video has, the number of promotions that the video has received, the list of
      owners of the video, etc.

    followers:
      bucket pattern: user ids
      key pattern: user ids
      This bucket-type stores an object for each follower that belongs to the users on the site.
      Each key within a given bucket records not only an active follower, but also information
      such as when the user received that follower.

    subscribers:
      bucket pattern: channel ids
      key pattern: user ids
      Like the followers bucket-type, this type stores an object for each subscriber that belongs
      to channels on the site.

    promotions:
      bucket pattern: video ids
      key pattern: user ids
      This bucket-type stores an object recording the amount of promotions donated to a video by
      various users.
  """

  @type key :: String.t() | atom

  defmodule NotFoundError do
    defexception message: "key could not be found"
  end

  defmodule QueryError do
    defexception message: "query failed, check the logs"
  end

  defmodule UnknownObjectError do
    defexception message: "unknown riak object"
  end

  def child_spec(opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [opts]}
    }
  end

  @doc """
  Start a link with the database.

  In the future, it should be considered whether this connection should
  be handled by a process pool using tools such as poolboy.

  The options provided are required to have at least a host and a port
  that defines the location of the database to connect to. Optionally,
  a name keyword can be included to register the process with the process
  registry.

  An additional responsibility for this method is to make sure that search
  indices are properly defined. However, this is a horrid place to keep such
  a responsibility and will be changed in a future version so that restarting
  this process doesn't involve file I/O.
  """
  def start_link(opts) do
    {[host: host, port: port], opts} = Keyword.split(opts, [:host, :port])
    {:ok, pid} = :riakc_pb_socket.start_link(to_charlist(host), port)

    for file <- Path.wildcard("priv/search/*.xml") do
      name =
        file
        |> Path.basename()
        |> String.replace(".xml", "")

      with {:ok, schema} <- File.read(file),
           :ok <- :riakc_pb_socket.create_search_schema(pid, name, schema),
           :ok <- :riakc_pb_socket.create_search_index(pid, name, name, []),
           :ok <- :riakc_pb_socket.set_bucket_type(pid, name, search_index: name) do
        :ok
      else
        {:error, :enoent} -> raise "file #{file} could not be read"
        {:error, _} -> raise "could not create schema for #{file}"
      end
    end

    with {:ok, name} <- Keyword.fetch(opts, :name) do
      Process.register(pid, name)
    end

    {:ok, pid}
  end

  @spec new_id(key, non_neg_integer) :: String.t()
  @doc """
  Generate a new unique identifier.
  """
  def new_id(prefix, bytes \\ 16) do
    :crypto.strong_rand_bytes(bytes)
    |> Base.encode32(padding: false)
    |> String.downcase()
    |> (&"#{prefix}_#{&1}").()
  end

  @spec lookup(pid, key, String.t()) :: {:ok, String.t()} | {:error, term}
  @doc """
  Convenience method for looking up a handle in the registry.

  This method abstracts away the need for constantly checking the handle to
  test whether or not it is a handle prefixed with a sigil such as "@" or "#",
  or if it is already an id that may have been acquired by some previous fetch.

  The type here is interpreted as the prefix for the different types of ids.

  ## Examples

      iex> Repo.lookup(:repo, :user, "@MrUser")
      {:ok, "user_5cm7saojbzrmjpnthxfarg7zjm"}

      iex> Repo.lookup(:repo, :user, "user_5cm7saojbzrmjpnthxfarg7zjm")
      {:ok, "user_5cm7saojbzrmjpnthxfarg7zjm"}

      iex> Repo.lookup(:repo, :user, "#Nobody")
      {:error, %WestEgg.Repo.NotFoundError{message: "key could not be found"}}
  """
  def lookup(pid, type, handle) do
    cond do
      not String.starts_with?(handle, "#{type}_") ->
        case fetch(pid, :registry, "#{type}s", handle) do
          {:ok, %{"id" => id}} -> {:ok, id}
          error -> error
        end

      true ->
        case fetch(pid, "#{type}s", handle, :profile) do
          {:ok, _} -> {:ok, handle}
          error -> error
        end
    end
  end

  @spec fetch(pid, key, key, key) :: {:ok, any} | {:error, term}
  @doc """
  Fetch a key from the database.

  ## Examples

      iex> Repo.fetch(:repo, :users, "user_meujhmacow7ltya23dghx5axrq", :profile)
      {:ok,
       %{
         "_type" => "application/riak_map",
         "creation_time" => 1596236332,
         "handle" => "@ljenkins",
         "title" => "Leeroy Jenkins ;)"
       }}
  """
  def fetch(pid, type, bucket, key) do
    [type, bucket, key] = Enum.map([type, bucket, key], &format_key/1)

    with {:ok, obj} <- :riakc_pb_socket.fetch_type(pid, {type, bucket}, key),
         {:ok, content} <- parse(obj) do
      {:ok, content}
    else
      {:error, :notfound} -> {:error, %NotFoundError{}}
      {:error, {:notfound, _}} -> {:error, %NotFoundError{}}
      {:error, :undefined} -> {:error, %UnknownObjectError{}}
      error -> error
    end
  end

  @spec drop(pid, key, key, key) :: :ok | {:error, term}
  @doc """
  Drop a key from the database.

  ## Examples

      iex> Repo.drop(:repo, :users, "user_meujhmacow7ltya23dghx5axrq", :profile)
      :ok
  """
  def drop(pid, type, bucket, key) do
    [type, bucket, key] = Enum.map([type, bucket, key], &format_key/1)

    case :riakc_pb_socket.delete(pid, {type, bucket}, key) do
      :ok -> :ok
      {:error, reason} -> raise reason
    end
  end

  @spec modify(pid, key, key, key, map) :: :ok | {:error, term}
  @doc """
  Modify the object stored in the provided key.

  Each object that is stored in our database is implemented using the Riak map datatype.
  Datatypes such as these help us by delegating conflict resolution to the server rather
  than require us to deal with potential siblings in our code here. Maps, in particular,
  function very similarly to JSON where strings are mapped to other Riak datatypes (such
  as registers, sets, or counters).

  Modifying these map objects involves passing the Erlang client functions that it uses
  to swap objects that are being stored within the map.

  To simplify this, the `Repo` module provides a number of functions that return anonymous
  functions that the Riak Erlang client will find useful. See the documentation on methods
  such as `add_element` and `increment` for more details.

  The `methods` argument for this function is a ordinary map that maps strings representing
  the keys within the Riak map to modify to functions ordinarily returned from the `Repo`
  modules convenience methods such as `add_element`.

  ## Examples

      iex> methods = %{
        "handle" => Repo.set("@ljenkins"),
        "title" => Repo.set("Leeroy Jenkins ;)")
      }

      iex> Repo.modify(:repo, :users, "user_meujhmacow7ltya23dghx5axrq", :profile, methods)
      :ok

      iex> Repo.fetch(:repo, :users, "user_meujhmacow7ltya23dghx5axrq", :profile)
      {:ok,
       %{
         "handle" => "@ljenkins",
         "title" => "Leeroy Jenkins ;)"
       }}
  """
  def modify(pid, type, bucket, key, methods) do
    [type, bucket, key] = Enum.map([type, bucket, key], &format_key/1)
    modify_fn = fn map -> update(map, methods) end

    case :riakc_pb_socket.modify_type(pid, modify_fn, {type, bucket}, key, [:create]) do
      :ok -> :ok
      {:error, :unmodified} -> :unmodified
      {:error, reason} -> raise reason
    end
  end

  @spec search(pid, key, String.t(), Keyword.t()) ::
          {:ok, {[any], float, non_neg_integer}} | {:error, term}
  @doc """
  Search an index using a SOLR query.

  This method searches the database using Riak Search 2.0 which utilizes SOLR for indexing.
  The `query` argument is a string containing a valid SOLR query, details for which may
  be found here:
  https://lucene.apache.org/solr/guide/8_6/the-standard-query-parser.html#the-standard-query-parser.
  However, be mindful that Riak Search uses an outdated version of SOLR so not all queries provided
  in the reference may be valid.

  ## Examples

      iex> Repo.search(:repo, :videos, "title_register:\"funny gaming video\"")
      {:ok
        {[
          %{
            bucket: "video_p753ljoijd2ny4v5yn2ei7727i",
            key: "profile",
            score: 3.520838
          }
        ], 3.5208380222320557, 1}}
  """
  def search(pid, index, query, opts \\ []) when is_binary(query) do
    case :riakc_pb_socket.search(pid, to_string(index), query, opts) do
      {:ok, {:search_results, results, max_score, matches}} ->
        results = results |> Enum.map(&parse_search_result/1)
        {:ok, {results, max_score, matches}}

      {:error, _} ->
        {:error, %QueryError{}}
    end
  end

  defp format_key(key), do: key |> to_string() |> String.trim() |> String.downcase()

  defp parse_search_result(result) do
    {_, keys} = result
    parse_result_keys(keys, %{})
  end

  defp parse_result_keys(keys, map) do
    case keys do
      [] ->
        map

      [{"score", value} | keys] ->
        {value, _} = Float.parse(value)
        parse_result_keys(keys, Map.put(map, :score, value))

      [{"_yz_rb", bucket} | keys] ->
        parse_result_keys(keys, Map.put(map, :bucket, bucket))

      [{"_yz_rk", key} | keys] ->
        parse_result_keys(keys, Map.put(map, :key, key))

      [_key | keys] ->
        parse_result_keys(keys, map)
    end
  end

  defp parse(obj) do
    cond do
      :riakc_map.is_type(obj) -> {:ok, do_parse(:map, :riakc_map.value(obj))}
      :riakc_set.is_type(obj) -> {:ok, do_parse(:set, :riakc_set.value(obj))}
      :riakc_flag.is_type(obj) -> {:ok, do_parse(:flag, :riakc_flag.value(obj))}
      :riakc_counter.is_type(obj) -> {:ok, do_parse(:counter, :riakc_counter.value(obj))}
      :riakc_register.is_type(obj) -> {:ok, do_parse(:register, :riakc_register.value(obj))}
      true -> {:error, :undefined}
    end
  end

  defp do_parse(:map, keypairs),
    do: Map.new(keypairs, fn {{key, type}, value} -> {key, do_parse(type, value)} end)

  defp do_parse(:register, value) do
    case Integer.parse(value) do
      {integer, _} -> integer
      :error -> value
    end
  end

  defp do_parse(_, value), do: value

  @spec add_element(String.t()) :: {:set, (any -> any)}
  @doc """
  Add an element to a set.
  """
  def add_element(binary), do: {:set, &:riakc_set.add_element(binary, &1)}

  @spec add_element?(String.t()) :: {:set, (any -> any)}
  @doc """
  Add an element to a set if the argument is nonempty, otherwise do nothing.
  """
  def add_element?(empty) when empty in [nil, ""], do: {:set, &Function.identity/1}
  def add_element?(binary), do: add_element(binary)

  @spec add_elements([String.t()]) :: {:set, (any -> any)}
  @doc """
  Add a list of elements to a set.
  """
  def add_elements(binaries), do: {:set, &:riakc_set.add_elements(binaries, &1)}

  @spec add_elements?([String.t()]) :: {:set, (any -> any)}
  @doc """
  Add a list of elements to a set if the argument is nonempty, otherwise do nothing.
  """
  def add_elements?(empty) when empty in [nil, []], do: {:set, &Function.identity/1}
  def add_elements?(binaries), do: add_elements(binaries)

  @spec del_element(String.t()) :: {:set, (any -> any)}
  @doc """
  Remove an element from a set.
  """
  def del_element(binary), do: {:set, &:riakc_set.del_element(binary, &1)}

  @spec del_element?(String.t()) :: {:set, (any -> any)}
  @doc """
  Remove an element from a set if the argument is nonempty, otherwise do nothing.
  """
  def del_element?(empty) when empty in [nil, ""], do: {:set, &Function.identity/1}
  def del_element?(binary), do: del_element(binary)

  @spec enable :: {:flag, (any -> any)}
  @doc """
  Set a flag to be true.
  """
  def enable, do: {:flag, &:riakc_flag.enable(&1)}

  @spec disable :: {:flag, (any -> any)}
  @doc """
  Set a flag to be false.

  NOTE: There is quirk with the Riak Erlang client that prevents this method
  from being used to create a new flag. Therefore, instead of creating a flag
  that defaults to `false`, instead let the flag represent false by omission.
  """
  def disable, do: {:flag, &:riakc_flag.disable(&1)}

  @spec increment :: {:counter, (any -> any)}
  @doc """
  Increment a counter by one.
  """
  def increment, do: {:counter, &:riakc_counter.increment(&1)}

  @spec increment(non_neg_integer) :: {:counter, (any -> any)}
  @doc """
  Increment a counter by an integer amount.
  """
  def increment(amount), do: {:counter, &:riakc_counter.increment(amount, &1)}

  @spec decrement :: {:counter, (any -> any)}
  @doc """
  Decrement a counter by one.
  """
  def decrement, do: {:counter, &:riakc_counter.decrement(&1)}

  @spec decrement(non_neg_integer) :: {:counter, (any -> any)}
  @doc """
  Decrement a counter by an integer amount.
  """
  def decrement(amount), do: {:counter, &:riakc_counter.decrement(amount, &1)}

  @spec set(String.t()) :: {:register, (any -> any)}
  @doc """
  Set a register to a given string.
  """
  def set(binary), do: {:register, &:riakc_register.set(binary, &1)}

  @spec set?(String.t()) :: {:register, (any -> any)}
  @doc """
  Set a register to a given string if the argument is nonempty, otherwise do nothing.
  """
  def set?(empty) when empty in [nil, ""], do: {:register, &Function.identity/1}
  def set?(binary), do: set(binary)

  @spec update(map) :: {:map, (any -> any)}
  @doc """
  Update a map within a map using a separate set of methods.
  """
  def update(methods), do: {:map, &update(&1, methods)}

  @spec update?(map) :: {:map, (any -> any)}
  @doc """
  Update a map within a map using a separate set of methods if the argument is nonempty,
  otherwise do nothing.
  """
  def update?(empty) when empty in [nil, %{}], do: {:map, &Function.identity/1}
  def update?(methods), do: update(methods)

  defp update(obj, methods) do
    transform = fn {key, {type, method}}, acc ->
      :riakc_map.update({key, type}, method, acc)
    end

    methods
    |> Map.to_list()
    |> Enum.reduce(obj, transform)
  end
end
