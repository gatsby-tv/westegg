# WestEgg [![Build Status](https://travis-ci.com/gatsby-tv/westegg.svg?branch=master)](https://travis-ci.com/gatsby-tv/westegg)

WestEgg is the backend for the Gatsby hub site and contains indexing data on users, channels, videos and more.

## Run development build (docker-compose)
1. Install docker and docker-compose
2. Run `docker-compose --env-file default.env up --build` or `docker-compose --env-file default.env up --scale westegg=0 -d` to exclude westegg (so you can run the npm version alongside for dev purposes)

*Note: If you're testing the frontend with this repo, exclude it from starting with the command:*

`docker-compose --env-file default.env up --build --scale gatsby=0 -d`

## Run development build (just westegg api server)
1. Install NodeJS 12.8
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
