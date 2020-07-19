defmodule WestEggTest do
  use ExUnit.Case
  doctest WestEgg

  test "greets the world" do
    assert WestEgg.hello() == :world
  end
end
