DROP KEYSPACE IF EXISTS videos;

CREATE KEYSPACE videos
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE videos.profiles
(id uuid PRIMARY KEY,
handle text,
title text,
updated timestamp,
created timestamp);
