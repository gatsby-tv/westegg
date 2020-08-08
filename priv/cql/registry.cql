DROP KEYSPACE IF EXISTS registry;

CREATE KEYSPACE registry
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE registry.handles
(handle text PRIMARY KEY,
id uuid,
in_use boolean);

CREATE TABLE registry.scoped_handles
(scope uuid,
handle text,
id uuid,
in_use boolean,
PRIMARY KEY ((scope, handle)));

CREATE TABLE registry.handles_by_id
(id uuid PRIMARY KEY,
scope uuid,
handle text);

CREATE TABLE registry.aliases
(id uuid,
handle text,
since bigint,
PRIMARY KEY (id, handle));

CREATE TABLE registry.aliases_by_handle
(handle text,
id uuid,
since bigint,
PRIMARY KEY (handle, id));

CREATE TABLE registry.aliases_by_scoped_handle
(scope uuid,
handle text,
id uuid,
since bigint,
PRIMARY KEY ((scope, handle), id));
