DROP KEYSPACE IF EXISTS sessions;

CREATE KEYSPACE sessions
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE sessions.logins
(session text PRIMARY KEY,
id uuid,
is_verified boolean);
