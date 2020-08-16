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
      {:xandra, "~> 0.13"},
      {:uuid, "~> 1.1"},
      {:plug_cowboy, "~> 2.0"},
      {:argon2_elixir, "~> 2.0"},
      {:poison, "~> 4.0"},
      {:email_checker, "~> 0.1.3"}
    ]
  end
end
