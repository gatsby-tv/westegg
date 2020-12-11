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
  -v mongo:/docker-entrypoint-initdb.d \
  -p 27017:27017 \
  mongo:4.4.1
```
4. Copy `default.env` as `.env` and fill out the environment variables, eg.
```
# DB Configuration
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_ROOT_PASS=root
MONGO_API_PASS=gatsby

JWT_SECRET=localhost
```
5. Run the server `npm start`

## Run development build (docker-compose)
1. Install docker and docker-compose
2. Run `docker-compose up --build`

## TODO: Build and deploy production
