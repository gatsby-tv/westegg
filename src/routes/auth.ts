import {
  ErrorMessage,
  NotFound,
  PostAuthSigninRequest,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";
import mail from "../mail";

const router = Router();

/**
 * POST /auth/signin
 * TODO: validate email middleware
 */
router.post("/signin", async (req, res, next) => {
  try {
    const signin = req.body as PostAuthSigninRequest;

    // TODO: Check if user already exists with email
    const exists = false;

    // TODO: Is there a better way to handle this "constructor" with typing?
    // TODO: https://mongoosejs.com/docs/middleware.html mongoose validation hooks
    let user = new User({
      email: signin.email,
      creationDate: Date.now()
    });
    await user.save();

    // Sign a JWT
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });

    // TODO: Store a the JWT in a redis session key that expires in 5 min
    const key = "werut712vt23";

    // Send an email to the user with the session key and if they need to complete signin
    const link = new URL(
      `/magiclink?key=${key}&exists=${exists}`,
      process.env.PUBLIC_URL!
    );
    await mail.send({
      to: user.email,
      from: "noreply@gatsby.sh",
      subject: "New signin request from Gatsby.",
      text: `Click this link to complete the sign in process: ${link}`
    });

    // Return 200 OK if no internal errors as to not indicate email is in use
    res.sendStatus(StatusCode.OK);
  } catch (error) {
    next(error);
  }
});

/**
 * TODO: GET /auth/session/:key
 */

/**
 * TODO: POST /auth/session/:key
 */

/**
 * TODO: POST /auth/session/:key
 */

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
