DROP KEYSPACE IF EXISTS users;

CREATE KEYSPACE users
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE users.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
updated timestamp,
created timestamp);
