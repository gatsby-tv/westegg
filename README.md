# WestEgg

West Egg is the backend for the Gatsby hub site and contains indexing data on users, channels, videos and more.

## Run development build
1. Install NodeJS 12 and Docker
2. Install dependencies `npm install`
3. Run postgres docker image locally
```
docker run -d \
  --name gatsby_postgres \
  -e POSTGRES_USER=gatsby \
  -e POSTGRES_PASSWORD=gatsby \
  -e POSTGRES_DB=gatsby \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -v gatsby_db:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres
```
4. Copy `default.env` as `.env` and fill out the environment variables, eg.
```
# DB Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=gatsby
POSTGRES_PASSWORD=gatsby
POSTGRES_DB=gatsby
JWT_SECRET=localhost
```
5. Run the server `npm start`

## Generate a migration
Run this every time a change to an entity is made or a new entity is created

`npm run typeorm:cli -- migration:generate -n MyMigration`

## TODO: Build and deploy production
