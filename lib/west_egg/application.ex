defmodule WestEgg.Application do
  use Application

  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: WestEgg, options: [port: 4001]},
      {Redix, {"redis://localhost:6379", [name: :redix]}}
    ]

    opts = [strategy: :one_for_one, name: WestEgg.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
