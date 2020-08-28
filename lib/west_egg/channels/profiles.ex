defmodule WestEgg.Channels.Profiles do
  use Daisy.Table

  table :profiles, keyspace: WestEgg.Channels do
    field :id, :uuid, validators: [presence: true]
    field :handle, :text
    field :display, :text, validators: [length: [in: 1..30]]
    field :updated, :timestamp
    field :created, :timestamp
    partition_key [:id]
  end
end
