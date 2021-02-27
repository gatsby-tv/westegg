import {
  ErrorMessage,
  GetUserAccountRequest,
  NotFound,
  StatusCode
} from "@gatsby-tv/types";
import { Request, Router } from "express";
import * as ExpressCore from "express-serve-static-core";
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
interface GetUserAccountRequestParams
  extends ExpressCore.ParamsDictionary,
    GetUserAccountRequest {}
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (req: Request<GetUserAccountRequestParams, {}, {}, {}>, res, next) => {
    try {
      // TODO: as GetUserAccountRequest
      const request = req.params;

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

      // TODO: as GetUserAccountResponse
      res.status(StatusCode.OK).json(user.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

// TODO: GET /user/:id/feeds
// TODO: GET /user/:id/promotions

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
      // TODO: as PutUserHandleRequest
      const request = req.body;

      const user = await User.findById(req.params.id);
      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      user.handle = request.handle;
      await user.save();

      // TODO: as PutUserHandleResponse
      res.status(StatusCode.CREATED).json(user.toJSON());
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
      // TODO: as PutUserAvatarRequest
      const request = req.params;

      const user = await User.findById(request.id);
      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      // TODO: Unpin the old avatar (not case where two users have same exact avatar hash?)

      // Get the file uploaded and add to the user
      user.avatar = req.ipfsContent!;
      user.save();

      // TODO: as PutUserAvatarResponse
      res.status(StatusCode.CREATED).json(user.toJSON());
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
      // TODO: as PutUserBannerRequestParams
      const request = req.params;

      const user = await User.findById(request.id);
      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      // TODO: Unpin the old banner (not in case where two users have the same banner)
      user.banner = req.ipfsContent!;
      user.save();

      res.status(StatusCode.CREATED).json(user.toJSON());
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
      // TODO: as PutUserSubscriptionRequestParams
      const user = await getCachedUserById(req.params.id);
      // TODO: as PutUserSubscriptionRequest
      user.subscriptions.push(req.body.subscription);
      user.save();

      res.status(StatusCode.CREATED).json(user.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
