DROP KEYSPACE IF EXISTS users;

CREATE KEYSPACE users
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE users.profiles
(id uuid PRIMARY KEY,
handle text,
display text,
since bigint);

CREATE TABLE users.followers
(id uuid,
follower uuid,
since bigint,
PRIMARY KEY (id, follower));

CREATE TABLE users.follows
(id uuid,
follow uuid,
since bigint,
PRIMARY KEY (id, follow));

CREATE TABLE users.subscriptions
(id uuid,
subscription uuid,
since bigint,
PRIMARY KEY (id, subscription));

CREATE TABLE users.promotions
(id uuid,
promotion uuid,
since bigint,
PRIMARY KEY (id, promotion));

CREATE TABLE users.channels
(id uuid,
channel uuid,
since bigint,
PRIMARY KEY (id, channel));

CREATE TABLE users.shows
(id uuid,
show uuid,
since bigint,
PRIMARY KEY (id, show));

CREATE TABLE users.videos
(id uuid,
video uuid,
since bigint,
PRIMARY KEY (id, video));
