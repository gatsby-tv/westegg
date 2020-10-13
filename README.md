# WestEgg

West Egg is the backend for the Gatsby hub site and contains indexing data on users, channels, videos and more.

## Run development build
1. Install NodeJS 12 and Docker
2. Install dependencies `npm install`
3. Run mongo docker image locally
```
docker run -d \
  --name gatsby_mongo \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=root \
  -e MONGO_API_USERNAME=gatsby \
  -e MONGO_API_PASSWORD=gatsby \
  -e MONGO_INITDB_DATABASE=gatsby \
  -v db:/data/db \
  -v ./mongo:/docker-entrypoint-initdb.d \
  -p 27017:27017 \
  mongo
```
4. Copy `default.env` as `.env` and fill out the environment variables, eg.
```
# DB Configuration
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_API_USERNAME=gatsby
MONGO_API_PASSWORD=gatsby
MONGO_DB=gatsby

JWT_SECRET=localhost
```
5. Run the server `npm start`

## Generate a migration
Run this every time a change to an entity is made or a new entity is created

`npm run typeorm:cli -- migration:generate -n MyMigration`

## TODO: Build and deploy production
