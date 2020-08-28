defmodule WestEgg.Channels.Profiles do
  use Daisy.Table

  table :profiles, keyspace: WestEgg.Channels do
    field :id, :bigint, validators: [presence: true]
    field :handle, :text, validators: [length: [in: 1..15]]
    field :display, :text, validators: [length: [in: 1..30]]
    field :updated, :timestamp
    partition_key [:id]
  end
end
