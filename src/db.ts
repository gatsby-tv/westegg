import { createConnection } from "typeorm";
import config from "./ormconfig";

const db = {
  connect: async () => {
    return await createConnection(config);
  }
};

export default db;
