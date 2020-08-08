DROP KEYSPACE IF EXISTS users;

CREATE KEYSPACE users
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE users.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
since bigint);

CREATE TABLE users.secrets
(id uuid PRIMARY KEY,
email text,
password text);

CREATE TABLE users.followers
(id uuid,
follower uuid,
since bigint,
PRIMARY KEY (id, follower));

CREATE TABLE users.following
(id uuid,
follow uuid,
since bigint,
PRIMARY KEY (id, follow));
