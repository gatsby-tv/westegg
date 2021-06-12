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
import { createHmac } from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { getCachedUserById } from "../cache";
import { InvalidToken } from "../entities/InvalidToken";
import { PersistSignInKey } from "../entities/PersistSignInKey";
import { SignInKey } from "../entities/SignInKey";
import { User } from "../entities/User";
import { Environment } from "../environment";
import { logger } from "../logger";
import mail from "../mail";
import { isAuthenticated, validateSignin } from "../middleware/auth";
import { randomString } from "../utilities";

const router = Router();

/**
 * POST /auth/signin
 */
router.post("/signin", validateSignin, async (req, res, next) => {
  try {
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
      `/magiclink?key=${signinKey.key}&exists=${exists}`,
      process.env.PUBLIC_URL!
    );

    // Don't send mail in dev
    if (process.env.WESTEGG_ENV! !== Environment.DEV) {
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
        `--DEV ONLY-- Email not sent to ${signinKey.email}. SignIn key sent in response!`
      );
      res.status(StatusCode.OK).json({ key: signinKey.key });
    }
  } catch (error) {
    next(error);
  }
});

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
router.post("/signin/:key/persist", async (req, res, next) => {
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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/token/refresh
 */
router.get("/token/refresh", isAuthenticated, async (req, res, next) => {
  try {
    // The isAuthenticated middleware confirmed our JWT is valid, send back a new JWT to refresh the login
    const user = await getCachedUserById(req.decodedToken!._id);
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
router.post("/token/invalidate", isAuthenticated, async (req, res, next) => {
  try {
    const invalid = new InvalidToken({
      expire: Date.now()
    });
    await InvalidToken.findByIdAndUpdate(req.decodedToken!._id, invalid, {
      upsert: true,
      setDefaultsOnInsert: true
    });

    res.sendStatus(StatusCode.CREATED);
  } catch (error) {
    next(error);
  }
});

export default router;
