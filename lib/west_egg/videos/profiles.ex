defmodule WestEgg.Videos.Profiles do
  use Daisy.Table

  table :profiles, keyspace: WestEgg.Videos do
    field :id, :uuid, validators: [presence: true]
    field :handle, :text
    field :title, :text, validators: [length: 1..100]
    field :updated, :timestamp
    field :created, :timestamp
    partition_key [:id]
  end
end
