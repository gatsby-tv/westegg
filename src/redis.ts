import redis from "redis";
import { promisify } from "util";

// TODO: Use environment variables to connect to redis
const client = redis.createClient();

// Promisify redis commands
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);

const asyncClient = {
  get,
  set
};

export default asyncClient;
