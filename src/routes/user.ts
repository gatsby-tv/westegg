import {
  ErrorMessage,
  GetUserAccountRequest,
  NotFound,
  StatusCode
} from "@gatsby-tv/types";
import { Request, Router } from "express";
import * as ExpressCore from "express-serve-static-core";
import { Types } from "mongoose";
import { User } from "../entities/User";
import { upload } from "../file";

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
// TODO: PUT /user/:id/handle

/**
 * TODO: PUT /user/:id/avatar
 */
// TODO: Add auth middleware
router.put("/:id/avatar", upload, async (req, res, next) => {
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
});

// TODO: PUT /user/:id/banner
// TODO: PUT /user/:id/subscription

export default router;
