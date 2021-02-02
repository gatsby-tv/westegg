import {
  BadRequest,
  ErrorMessage,
  NotFound,
  PostAuthSignupRequest,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";
import { Environment } from "../environment";
import { isAuthenticated, validateSignup } from "../middleware/auth";

const router = Router();

/**
 * POST /auth/signup
 */
router.post(
  "/signup",
  isAuthenticated,
  validateSignup,
  async (req, res, next) => {
    try {
      const signup: PostAuthSignupRequest = req.body;

      // TODO: Is there a better way to handle this "constructor" with typing?
      // TODO: https://mongoosejs.com/docs/middleware.html mongoose validation hooks
      let user = new User({
        _id: signup._id || req.decodedToken!._id,
        handle: signup.handle,
        name: signup.name,
        creationDate: Date.now()
      });
      await user.save();

      res
        .status(StatusCode.CREATED)
        .json(user.toJSON() as PostAuthSignupRequest);
    } catch (error) {
      next(error);
    }
  }
);

// TODO: /auth/user/:id/exists

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

/**
 * GET /auth/devtoken
 * ONLY ENABLE ON DEV
 */
if (Environment.DEV === process.env.WESTEGG_ENV) {
  router.get("/devtoken", async (req, res, next) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        throw new BadRequest(ErrorMessage.BAD_REQUEST);
      }
      const secret = Buffer.from(key).toString("base64");

      // Get optional id query param from request, if not there generate new
      let id = req.query.id || new Types.ObjectId();
      const token = jwt.sign({ _id: id }, secret, {
        expiresIn: "2w"
      });
      res.status(StatusCode.OK).json({ token });
    } catch (error) {
      next(error);
    }
  });
}

export default router;
