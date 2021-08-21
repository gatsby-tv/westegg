import mongoose from "mongoose";

const params = new URLSearchParams();
params.set("retryWrite", "true");
params.set("writeConcern", "majority");
params.set("authSource", "admin");

const db = {
  connect: async () => {
    await mongoose.connect(`${process.env.MONGO_URL}?${params}`, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
};

export default db;
