import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import "reflect-metadata";
import db from "./db";

// Import routes
import auth from "./routes/auth";

const app = express();
const port = process.env.PORT || 8080;

// Add json body parser
app.use(bodyParser.json());

// Allow CORS for all requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, PUT, POST, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Add routes to app
app.use("/auth", auth);

// Unhandled errors
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (!res.headersSent) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
(async () => {
  const connection = await db.connect();
  await connection.runMigrations();
  app.listen(port, () => {
    // tslint:disable-next-line
    console.log(`Server started at http://localhost:${port}/`);
  });
})();
