import "@src/environment";

import express, { NextFunction, Request, Response } from "express";
import {
  ErrorResponse,
  InternalError,
  StatusCode,
  WestEggError
} from "@gatsby-tv/types";

import db from "@src/db";
import logger from "@src/logger";
import auth from "@src/routes/auth";
import channel from "@src/routes/channel";
import listing from "@src/routes/listing";
import user from "@src/routes/user";
import video from "@src/routes/video";

const router = express.Router();
const app = express();
const port = process.env.PORT || 3001;

// Add json body parser
app.use(express.json());

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
router.use("/auth", auth);
router.use("/user", user);
router.use("/channel", channel);
router.use("/video", video);
router.use("/listing", listing);

// Set API version
app.use("/v1", router);

// Handle all errors
app.use(
  (
    error: WestEggError | Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Check if response already sent
    if (res.headersSent) {
      return;
    }

    // Check if error is specific with response code
    if (error instanceof WestEggError) {
      return res.status(error.statusCode).json({ error } as ErrorResponse);
    }

    // If not, log and send generic internal error
    else {
      logger.error(error);
      return res.status(StatusCode.INTERNAL_ERROR).json({
        error: new InternalError()
      } as ErrorResponse);
    }
  }
);

// Start server
(async () => {
  await db.connect();
  app.listen(port, () => {
    logger.info(`Server started at http://localhost:${port}/`);
  });
})();
