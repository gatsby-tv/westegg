defmodule WestEgg.Videos do
  use Daisy.Keyspace

  keyspace :videos, conn: Videos.Conn do
    with_options [
      replication: "{'class': 'SimpleStrategy', 'replication_factor': 3}"
    ]
  end
end
