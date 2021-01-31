import { PostAuthSignupRequest, StatusCode } from "@gatsby-tv/types";
import { Router } from "express";
import { User } from "../entities/User";
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
        _id: signup._id,
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

export default router;
