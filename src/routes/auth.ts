import {
  BadRequest,
  ErrorMessage,
  PostAuthSignupRequest,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
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

/**
 * GET /auth/devtoken
 * ONLY ENABLE ON DEV
 */
if (Environment.DEV === process.env.ENVIRONMENT) {
  router.get("/devtoken", (req, res, next) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        throw new BadRequest(ErrorMessage.BAD_REQUEST);
      }
      const secret = Buffer.from(key).toString("base64");
      const token = jwt.sign({ _id: new Types.ObjectId() }, secret, {
        expiresIn: "2w"
      });
      res.status(StatusCode.OK).json({ token });
    } catch (error) {
      next(error);
    }
  });
}

export default router;
