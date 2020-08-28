defmodule WestEgg.Users do
  use Daisy.Keyspace

  keyspace :users, conn: Users.Conn do
    with_options [
      replication: "{'class': 'SimpleStrategy', 'replication_factor': 3}"
    ]
  end
end
