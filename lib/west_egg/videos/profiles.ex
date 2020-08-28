defmodule WestEgg.Videos.Profiles do
  use Daisy.Table

  table :profiles, keyspace: WestEgg.Videos do
    field :id, :bigint, validators: [presence: true]
    field :hash, :text
    field :title, :text, validators: [length: 1..100]
    field :updated, :timestamp
    partition_key [:id]
  end
end
