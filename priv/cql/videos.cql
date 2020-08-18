DROP KEYSPACE IF EXISTS videos;

CREATE KEYSPACE videos
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE videos.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
channel uuid,
show uuid,
since bigint);

CREATE TABLE videos.statistics
(id uuid PRIMARY KEY,
owners counter,
promoters counter,
votes counter);

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
