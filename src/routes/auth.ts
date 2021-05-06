import {
  ErrorMessage,
  GetAuthSessionRequest,
  GetAuthSessionResponse,
  NotFound,
  PostAuthCompleteSignupRequest,
  PostAuthCompleteSignupResponse,
  PostAuthPersistSessionKeyRequestParams,
  PostAuthSigninRequest,
  PostAuthSigninResponse,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Channel } from "../entities/Channel";
import { Session } from "../entities/Session";
import { User } from "../entities/User";
import { Environment } from "../environment";
import { logger } from "../logger";
import mail from "../mail";

const router = Router();

/**
 * POST /auth/signin
 * TODO: validate email middleware
 */
router.post("/signin", async (req, res, next) => {
  try {
    const signin = req.body as PostAuthSigninRequest;

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
      res.status(StatusCode.OK).send({} as PostAuthSigninResponse);
    } else {
      // Send session key (ONLY IN DEV)
      logger.warn(
        `--DEV ONLY-- Email not sent to ${session.email}. Session key sent in response!`
      );
      res.status(StatusCode.OK).send({ key: session._id });
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
      // TODO: Change to SESSION_NOT_FOUND
      throw new NotFound(ErrorMessage.SESSION_DOES_NOT_EXIST);
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

    res.status(StatusCode.OK).send({ token } as GetAuthSessionResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/session/:key
 */
router.post("/session/:key", async (req, res, next) => {
  try {
    const params = req.params as PostAuthPersistSessionKeyRequestParams;
    const body = req.body as PostAuthCompleteSignupRequest;

    // Check if session exists
    const session = await Session.findById(params.key);
    if (!session) {
      // TODO: Change to SESSION_NOT_FOUND
      throw new NotFound(ErrorMessage.SESSION_DOES_NOT_EXIST);
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

    res
      .status(StatusCode.CREATED)
      .send({ token } as PostAuthCompleteSignupResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * TODO: POST /auth/signup/:key
 */

/**
 * TODO: GET /auth/signin/refresh
 */

/**
 * GET /auth/user/handle/:handle/exists
 */
router.get("/user/handle/:handle/exists", async (req, res, next) => {
  try {
    // TODO: as GetAuthUserHandleExistsRequest
    const request = req.params;
    const user = await User.findOne({ handle: request.handle });

    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    // TODO: as GetAuthUserHandleExistsResponse
    res.status(StatusCode.OK).json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/channel/handle/:handle/exists
 */
router.get("/channel/handle/:handle/exists", async (req, res, next) => {
  try {
    // TODO: GetAuthChannelHandleExistsRequest
    const request = req.params;
    const channel = await Channel.findOne({ handle: request.handle });

    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    // TODO: as GetAuthChannelHandleExistsResponse
    res.status(StatusCode.OK).json(channel.toJSON());
  } catch (error) {
    next(error);
  }
});

export default router;
