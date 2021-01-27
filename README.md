# WestEgg

WestEgg is the backend for the Gatsby hub site and contains indexing data on users, channels, videos and more.

## Run development build (docker-compose)
1. Install docker and docker-compose
2. Run `docker-compose up --build`

## Run development build (just westegg api server)
1. Install NodeJS 12 and Docker
2. Install dependencies `npm install`
3. Copy `default.env` as `.env` and fill out the environment variables, eg.
```
# DB Configuration
MONGO_PROTOCOL=mongodb
MONGO_HOST=localhost
MONGO_ROOT_PASS=root
MONGO_API_PASS=gatsby
# IPFS
IPFS_URL=http://localhost:5001

JWT_SECRET=localhost
```
4. Run the server `npm start`
