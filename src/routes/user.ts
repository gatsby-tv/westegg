import {
  ErrorMessage,
  GetUserAccountRequest,
  NotFound,
  StatusCode
} from "@gatsby-tv/types";
import { Request, Router } from "express";
import * as ExpressCore from "express-serve-static-core";
import IPFSClient from "ipfs-http-client";
import { Types } from "mongoose";
import { User } from "../entities/User";

const router = Router();
const ipfs = IPFSClient({
  url: process.env.IPFS_URL || "http://localhost:5001"
});

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

// TODO: Write PutAvatarUserRequest
// // Update avatar
// if (request.avatar) {
//   // TODO: Validate mime type is allowed
//   // TODO: use ipfs block stat or ipfs files stat
//   // TODO: Validate file contents
//   // TODO: Validate file size
//   // Pin on IPFS node/cluster
//   await ipfs.pin.add(request.avatar.hash);
//   // TODO: Unpin old avatar if pinned successfully
//   // Add new avatar metadata to user
//   user.avatar = request.avatar;
// }

export default router;
