defmodule WestEgg.MixProject do
  use Mix.Project

  def project do
    [
      app: :west_egg,
      version: "0.1.0",
      elixir: "~> 1.10",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {WestEgg.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:riakc, git: "https://github.com/basho/riak-erlang-client"},
      {:plug_cowboy, "~> 2.0"},
      {:cors_plug, "~> 2.0"},
      {:poison, "~> 4.0"}
    ]
  end
end
