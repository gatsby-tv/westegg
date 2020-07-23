defmodule WestEgg.Application do
  @moduledoc false

  use Application

  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: WestEgg, options: [port: 4001]},
      {WestEgg.Repo, host: "localhost", port: 8087, name: :repo}
    ]

    opts = [strategy: :one_for_one, name: WestEgg.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
