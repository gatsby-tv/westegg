# WestEgg [![Build Status](https://travis-ci.com/gatsby-tv/westegg.svg?branch=master)](https://travis-ci.com/gatsby-tv/westegg)

WestEgg is the backend for the Gatsby hub site and contains indexing data on users, channels, videos and more.

## Run development build (docker-compose)

1. Install docker and docker-compose
2. Run `docker-compose up --build` or `docker-compose up -d --scale westegg=0` to exclude westegg (so you can run the local version alongside for dev purposes)

_Note: If you're testing the frontend with this repo, exclude it from starting with the command:_

`docker-compose up -d --build --scale gatsby=0`

## Run development build (just westegg api server)

1. Install NodeJS 12.8
2. Install dependencies `yarn install`
3. Run the server `yarn start`
