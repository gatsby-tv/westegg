import { ConnectionOptions } from "typeorm";

const config: ConnectionOptions = {
  type: "mongodb",
  host: process.env.MONGO_HOST,
  port: Number(process.env.MONGO_PORT),
  username: "gatsby",
  password: process.env.MONGO_API_PASS,
  database: "gatsby",
  useUnifiedTopology: true,
  authSource: "admin",
  entities: [__dirname + "/entities/**/*{.ts,.js}"],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  cli: {
    migrationsDir: "src/migrations"
  }
};

export = config;
