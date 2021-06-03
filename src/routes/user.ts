import {
  ErrorMessage,
  GetUserAccountRequest,
  GetUserAccountResponse,
  GetUserFeedsRequest,
  GetUserPromotionsRequest,
  NotFound,
  PutUserAvatarRequestParams,
  PutUserAvatarResponse,
  PutUserBannerRequestParams,
  PutUserBannerResponse,
  PutUserHandleRequest,
  PutUserHandleResponse,
  PutUserSubscriptionRequest,
  PutUserSubscriptionRequestParams,
  PutUserSubscriptionResponse,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import { Types } from "mongoose";
import { getCachedUserById } from "../cache";
import { User } from "../entities/User";
import { isAuthenticated } from "../middleware/auth";
import { upload } from "../middleware/multipart";
import {
  hasPermissionToPutUserRequest,
  validatePutUserHandleRequest
} from "../middleware/user";

const router = Router();

/**
 * GET /user/{:id, :handle}
 */
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (req, res, next) => {
    try {
      const request = req.params as GetUserAccountRequest;

      let user;
      try {
        const id = new Types.ObjectId(request.unique);
        user = await User.findById(id);
      } catch (error) {
        // Not a mongo object id, try with handle
        user = await User.findOne({ handle: request.unique });
      }

      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      res.status(StatusCode.OK).json(user.toJSON() as GetUserAccountResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /user/:id/feeds TODO: Should this be private?
 */
router.get("/:id/feeds", async (req, res, next) => {
  try {
    const request = req.params as GetUserFeedsRequest;
    const user = await getCachedUserById(request.id);
    // TODO: Should this be a combination of subscriptions and followed users?
    res.status(StatusCode.OK).json([user.subscriptions, user.following]);
  } catch (error) {
    next(error);
  }
});
/**
 * GET /user/:id/promotions TODO: Should this be private?
 */
router.get("/:id/promotions", async (req, res, next) => {
  const request = req.params as GetUserPromotionsRequest;
  const user = await getCachedUserById(request.id);
  res.status(StatusCode.OK).json(user.promotions);
});

/**
 * PUT /user/:id/handle
 */
router.put(
  "/:id/handle",
  isAuthenticated,
  hasPermissionToPutUserRequest,
  validatePutUserHandleRequest,
  async (req, res, next) => {
    try {
      const request = req.body as PutUserHandleRequest;

      const user = await User.findById(req.params.id);
      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      user.handle = request.handle;
      await user.save();

      res
        .status(StatusCode.CREATED)
        .json(user.toJSON() as PutUserHandleResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /user/:id/avatar
 */
router.put(
  "/:id/avatar",
  isAuthenticated,
  hasPermissionToPutUserRequest,
  upload,
  async (req, res, next) => {
    try {
      const request = req.params as PutUserAvatarRequestParams;

      const user = await User.findById(request.id);
      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      // TODO: Unpin the old avatar (not case where two users have same exact avatar hash?)

      // Get the file uploaded and add to the user
      user.avatar = req.ipfsContent!;
      user.save();

      res
        .status(StatusCode.CREATED)
        .json(user.toJSON() as PutUserAvatarResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /user/:id/banner
 */
router.put(
  "/:id/banner",
  isAuthenticated,
  hasPermissionToPutUserRequest,
  upload,
  async (req, res, next) => {
    try {
      const request = req.params as PutUserBannerRequestParams;

      const user = await User.findById(request.id);
      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      // TODO: Unpin the old banner (not in case where two users have the same banner)
      user.banner = req.ipfsContent!;
      user.save();

      res
        .status(StatusCode.CREATED)
        .json(user.toJSON() as PutUserBannerResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /user/:id/subscription
 */
router.put(
  "/:id/subscription",
  isAuthenticated,
  hasPermissionToPutUserRequest,
  async (req, res, next) => {
    try {
      const body = req.body as PutUserSubscriptionRequest;
      const params = req.params as PutUserSubscriptionRequestParams;

      const user = await getCachedUserById(params.id);
      // TODO: Prevent subscription to the same channel twice (set)
      user.subscriptions.push(body.subscription);
      user.save();

      res
        .status(StatusCode.CREATED)
        .json(user.toJSON() as PutUserSubscriptionResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
