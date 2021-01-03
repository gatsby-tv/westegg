import mongoose from "mongoose";

// Create connection string to mongodb
const connectionString = `${process.env.MONGO_PROTOCOL}://gatsby:${process.env.MONGO_API_PASS}@${process.env.MONGO_HOST}/gatsby?retryWrites=true&w=majority&authSource=admin`;

const db = {
  connect: async () => {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    });
  }
};

export default db;
