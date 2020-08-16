DROP KEYSPACE IF EXISTS channels;

CREATE KEYSPACE channels
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE channels.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
since bigint);

CREATE TABLE channels.owners
(id uuid,
owner uuid,
since bigint,
PRIMARY KEY (id, owner));

CREATE TABLE channels.subscribers
(id uuid,
subscriber uuid,
since bigint,
PRIMARY KEY (id, subscriber));

CREATE TABLE channels.shows
(id uuid,
show uuid,
since bigint,
PRIMARY KEY (id, show));

CREATE TABLE channels.videos
(id uuid,
video uuid,
since bigint,
PRIMARY KEY (id, video));
