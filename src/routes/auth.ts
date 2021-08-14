import {
  ErrorMessage,
  GetAuthSignInKeyRequest,
  GetAuthSignInKeyResponse,
  GetAuthTokenRefreshResponse,
  NotFound,
  PostAuthPersistSignInKeyRequestParams,
  PostAuthSignInRequest,
  PostAuthSignInResponse,
  StatusCode
} from "@gatsby-tv/types";
import { InvalidToken } from "@src/entities/InvalidToken";
import { PersistSignInKey } from "@src/entities/PersistSignInKey";
import { SignInKey } from "@src/entities/SignInKey";
import { User } from "@src/entities/User";
import logger from "@src/logger";
import mail from "@src/mail";
import { isValidBody } from "@src/middleware";
import { isAuthenticated, validateSignin } from "@src/middleware/auth";
import {
  //commitTransaction,
  startTransaction
} from "@src/middleware/transaction";
import { randomString } from "@src/utilities";
import { createHmac } from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { TransactionOptions } from "mongodb";
import mongoose from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";

const router = Router();

/**
 * POST /auth/signin
 */
router.post(
  "/signin",
  validateSignin,
  //startTransaction,
  (req: Request, res: Response, next: NextFunction) => {
    isValidBody(keysOf<PostAuthSignInRequest>(), req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    const params = new URLSearchParams();
    params.set("retryWrite", "true");
    params.set("w", "majority");
    params.set("authSource", "admin");
    const connection = await mongoose.createConnection(
      `${process.env.MONGO_URL}?${params}`,
      {
        useFindAndModify: false,
        useCreateIndex: true
      }
    );
    const session = await connection.startSession();
    try {
      await session.withTransaction(async () => {
        const signin = req.body as PostAuthSignInRequest;

        // Check if user already exists with email
        const exists = !!(await User.findOne({ email: signin.email }));

        // Create a signinKey that expires after set time (see entities/SignInKey.ts)
        const key = createHmac("sha256", randomString()).digest("hex");
        const signinKey = new SignInKey({
          key: key,
          email: signin.email
        });
        await signinKey.save();

        // Send an email to the user with the signin key and if they need to complete signin
        const link = new URL(
          `/$magiclink?key=${signinKey.key}&exists=${exists}`,
          process.env.GATSBY_URL!
        );

        // Don't send mail in dev
        if (process.env.NODE_ENV !== "development") {
          await mail.send({
            to: signin.email,
            from: "noreply@gatsby.sh",
            subject: "New signin request from Gatsby.",
            text: `Click this link to complete the sign in process: ${link}`
          });
          // Return 200 OK if no internal errors as to not indicate email is in use
          res.status(StatusCode.OK).json({} as PostAuthSignInResponse);
        } else {
          // Send signinKey key (ONLY IN DEV)
          logger.warn(
            `Email not sent to ${signinKey.email}. SignIn key sent in response.`
          );
          res.status(StatusCode.OK).json({ key: signinKey.key });
        }
      });
      // next();
    } catch (error) {
      console.log("Aborting transaction");
      // await session.abortTransaction();
      next(error);
    }
  }
  //commitTransaction
);

/**
 * GET /auth/signin/:key
 */
router.get("/signin/:key", async (req, res, next) => {
  try {
    const params = req.params as GetAuthSignInKeyRequest;

    // Check if signin key exists
    const signinKey = await SignInKey.findOne({ key: params.key });
    if (!signinKey) {
      throw new NotFound(ErrorMessage.SIGNIN_KEY_NOT_FOUND);
    }

    // Check if the user already exists
    const user = await User.findOne({ email: signinKey.email });
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    // Sign a jwt with the user
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });

    // Drop the signin key (if exists)
    signinKey.remove();

    res.status(StatusCode.OK).json({ token } as GetAuthSignInKeyResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/signin/:key/persist
 */
router.post(
  "/signin/:key/persist",
  //startTransaction,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as PostAuthPersistSignInKeyRequestParams;

      const signinKey = await SignInKey.findOne({ key: params.key });
      if (signinKey) {
        const persistSignInKey = new PersistSignInKey({
          _id: signinKey._id,
          key: signinKey.key,
          email: signinKey.email
        });
        await persistSignInKey.save();
      }

      // ALWAYS send back OK as to not let the client know if the key exists or not
      res.sendStatus(StatusCode.OK);
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

/**
 * GET /auth/token/refresh
 */
router.get("/token/refresh", isAuthenticated, async (req, res, next) => {
  try {
    // The isAuthenticated middleware confirmed our JWT is valid, send back a new JWT to refresh the login
    const user = await User.findById(req.decodedToken!._id);
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });
    res.json({ token } as GetAuthTokenRefreshResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/token/invalidate
 */
router.post(
  "/token/invalidate",
  isAuthenticated,
  //startTransaction,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invalid = new InvalidToken({
        expire: Date.now()
      });
      await InvalidToken.findByIdAndUpdate(req.decodedToken!._id, invalid, {
        upsert: true,
        setDefaultsOnInsert: true
      });

      res.sendStatus(StatusCode.CREATED);
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

export default router;
