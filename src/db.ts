import { createConnection, Connection } from "typeorm";
import config from "./ormconfig";

let connection: Connection;

const db = {
  connect: async () => {
    connection = await createConnection(config);
    return connection;
  },
  getConnection: () => {
    return connection;
  }
};

export default db;
