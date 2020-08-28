DROP KEYSPACE IF EXISTS channels;

CREATE KEYSPACE channels
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE channels.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
updated timestamp,
created timestamp);
