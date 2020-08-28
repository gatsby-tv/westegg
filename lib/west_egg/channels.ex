defmodule WestEgg.Channels do
  use Daisy.Keyspace

  keyspace :channels, conn: Channels.Conn do
    with_options [
      replication: "{'class': 'SimpleStrategy', 'replication_factor': 3}"
    ]
  end
end
