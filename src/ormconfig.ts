import { ConnectionOptions } from "typeorm";

const config: ConnectionOptions = {
  type: "mongodb",
  host: process.env.MONGO_HOST,
  port: Number(process.env.MONGO_PORT),
  username: process.env.MONGO_USER,
  password: process.env.MONGO_PASSWORD,
  database: process.env.MONGO_DB,
  useUnifiedTopology: true,
  entities: [__dirname + "/entities/**/*{.ts,.js}"],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  cli: {
    migrationsDir: "src/migrations"
  }
};

export = config;
