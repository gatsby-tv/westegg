DROP KEYSPACE IF EXISTS videos;

CREATE KEYSPACE videos
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE videos.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
since bigint);

CREATE TABLE videos.owners
(id uuid,
owner uuid,
since bigint,
PRIMARY KEY (id, owner));

CREATE TABLE videos.promoters
(id uuid,
promoter uuid,
since bigint,
PRIMARY KEY (id, promoter));
