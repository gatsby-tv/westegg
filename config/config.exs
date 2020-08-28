use Mix.Config

config :daisy,
  clusters: [
    [
      conn: Users.Conn,
      nodes: ["localhost"],
      pool: Xandra.Cluster,
      underlying_pool: DBConnection.Poolboy,
      pool_size: 10,
      keyspace: "users"
    ],
    [
      conn: Channels.Conn,
      nodes: ["localhost"],
      pool: Xandra.Cluster,
      underlying_pool: DBConnection.Poolboy,
      pool_size: 10,
      keyspace: "channels"
    ]
  ]
