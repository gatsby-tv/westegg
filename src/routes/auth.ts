import {
  ErrorMessage,
  GetAuthChannelHandleExistsRequest,
  GetAuthChannelHandleExistsResponse,
  GetAuthSessionRequest,
  GetAuthSessionResponse,
  GetAuthSignInRefreshResponse,
  GetAuthUserHandleExistsRequest,
  NotFound,
  PostAuthCompleteSignUpRequest,
  PostAuthCompleteSignUpRequestParams,
  PostAuthCompleteSignUpResponse,
  PostAuthPersistSessionRequestParams,
  PostAuthSignInRequest,
  PostAuthSignInResponse,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { getCachedUserById } from "../cache";
import { Channel } from "../entities/Channel";
import { InvalidToken } from "../entities/InvalidToken";
import { PersistSession } from "../entities/PersistSession";
import { Session } from "../entities/Session";
import { User } from "../entities/User";
import { Environment } from "../environment";
import { logger } from "../logger";
import mail from "../mail";
import {
  isAuthenticated,
  validateSignin,
  validateSignup
} from "../middleware/auth";

const router = Router();

/**
 * POST /auth/signin
 */
router.post("/signin", validateSignin, async (req, res, next) => {
  try {
    const signin = req.body as PostAuthSignInRequest;

    // Check if user already exists with email
    const exists = !!(await User.findOne({ email: signin.email }));

    // Create a session that expires after set time (see entities/Session.ts)
    const session = new Session({
      email: signin.email
    });
    await session.save();

    // Send an email to the user with the session key and if they need to complete signin
    const link = new URL(
      `/magiclink?key=${session._id}&exists=${exists}`,
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
      // Send session key (ONLY IN DEV)
      logger.warn(
        `--DEV ONLY-- Email not sent to ${session.email}. Session key sent in response!`
      );
      res.status(StatusCode.OK).json({ key: session._id });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/session/:key
 */
router.get("/session/:key", async (req, res, next) => {
  try {
    const request = req.params as GetAuthSessionRequest;

    // Check if session exists
    const session = await Session.findById(request.key);
    if (!session) {
      throw new NotFound(ErrorMessage.SESSION_NOT_FOUND);
    }

    // Check if the user already exists
    const user = await User.findOne({ email: session.email });
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    // Sign a jwt with the user
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });

    // Drop the session (if exists)
    session.delete();

    res.status(StatusCode.OK).json({ token } as GetAuthSessionResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/session/:key
 */
router.post("/session/:key", validateSignup, async (req, res, next) => {
  try {
    const params = req.params as PostAuthCompleteSignUpRequestParams;
    const body = req.body as PostAuthCompleteSignUpRequest;

    // Check if session exists
    const session =
      (await PersistSession.findById(params.key)) ||
      (await Session.findById(params.key));
    if (!session) {
      throw new NotFound(ErrorMessage.SESSION_NOT_FOUND);
    }

    // TODO: Is there a better way to handle this "constructor" with typing?
    // TODO: https://mongoosejs.com/docs/middleware.html mongoose validation hooks
    const user = new User({
      handle: body.handle,
      name: body.name,
      email: session.email,
      creationDate: Date.now()
    });
    await user.save();

    // Sign a jwt with the user
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });

    // Drop the session or persist session (if exists)
    session.delete();

    res
      .status(StatusCode.CREATED)
      .json({ token } as PostAuthCompleteSignUpResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/signin/refresh
 */
router.get("/signin/refresh", isAuthenticated, async (req, res, next) => {
  try {
    // The isAuthenticated middleware confirmed our JWT is valid, send back a new JWT to refresh the login
    const user = await getCachedUserById(req.decodedToken!._id);
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });
    res.json({ token } as GetAuthSignInRefreshResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/session/:key/persist
 */
router.post("/session/:key/persist", async (req, res, next) => {
  try {
    const params = req.params as PostAuthPersistSessionRequestParams;

    const session = await Session.findById(params.key);
    if (session) {
      const persistSession = new PersistSession({
        _id: session._id,
        email: session.email
      });
      await persistSession.save();
      // Drop the original session
      await session.delete();
    }

    // ALWAYS send back OK as to not let the client know if the key exists or not
    res.sendStatus(StatusCode.OK);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/token/valid
 */
router.get("/token/valid", isAuthenticated, async (req, res, next) => {
  try {
    res.sendStatus(StatusCode.OK);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/token/invalidate
 */
router.post("/token/invalidate", isAuthenticated, async (req, res, next) => {
  // TODO:
  // Update isAuthenticated route to check for old tokens from collection

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

/**
 * GET /auth/user/handle/:handle/exists
 */
router.get("/user/handle/:handle/exists", async (req, res, next) => {
  try {
    const request = req.params as GetAuthUserHandleExistsRequest;
    const user = await User.findOne({ handle: request.handle });

    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    res
      .status(StatusCode.OK)
      .json(user.toJSON() as GetAuthChannelHandleExistsResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/channel/handle/:handle/exists
 */
router.get("/channel/handle/:handle/exists", async (req, res, next) => {
  try {
    const request = req.params as GetAuthChannelHandleExistsRequest;
    const channel = await Channel.findOne({ handle: request.handle });

    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    res
      .status(StatusCode.OK)
      .json(channel.toJSON() as GetAuthChannelHandleExistsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
