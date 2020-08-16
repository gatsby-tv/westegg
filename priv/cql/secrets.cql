DROP KEYSPACE IF EXISTS secrets;

CREATE KEYSPACE secrets
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE secrets.logins
(id uuid PRIMARY KEY,
password text);
