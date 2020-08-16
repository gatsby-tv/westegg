DROP KEYSPACE IF EXISTS shows;

CREATE KEYSPACE shows
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE shows.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
since bigint);

CREATE TABLE shows.owners
(id uuid,
owner uuid,
since bigint,
PRIMARY KEY (id, owner));

CREATE TABLE shows.videos
(id uuid,
video uuid,
since bigint,
PRIMARY KEY (id, video));
