defmodule WestEgg.Application do
  @moduledoc false

  use Application

  def start(_type, _args) do
    children = [
      # {Plug.Cowboy, scheme: :http, plug: WestEgg, options: [port: 4001]},
      {Xandra, nodes: ["localhost:9042"], name: :xandra}
    ]

    opts = [strategy: :one_for_one, name: WestEgg.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
