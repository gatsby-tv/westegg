import {
  ErrorMessage,
  GetUserAccountRequest,
  NotFound,
  PutUserRequest,
  StatusCode
} from "@gatsby-tv/types";
import { Request, Router } from "express";
import * as ExpressCore from "express-serve-static-core";
import IPFSClient from "ipfs-http-client";
import { User } from "../entities/User";

const router = Router();
const ipfs = IPFSClient({
  url: process.env.IPFS_URL || "http://localhost:5001"
});

/**
 * GET /user/:handle
 */
interface GetUserAccountRequestParams
  extends ExpressCore.ParamsDictionary,
    GetUserAccountRequest {}
router.get(
  "/:handle",
  async (req: Request<GetUserAccountRequestParams, {}, {}, {}>, res, next) => {
    try {
      // TODO: as GetUserAccountRequest
      const request = req.params;

      const user = await User.findById(request.handle);

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

/**
 * PUT /user/:handle
 */
// TODO: Add auth middleware
router.put("/:handle", async (req, res, next) => {
  try {
    const request: PutUserRequest = req.body;
    const handle = req.params.handle;

    // Get the user to update
    const user = await User.findById(handle);

    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    // Update avatar
    if (request.avatar) {
      // TODO: Validate mime type is allowed
      // TODO: use ipfs block stat or ipfs files stat
      // TODO: Validate file contents
      // TODO: Validate file size
      // Pin on IPFS node/cluster
      await ipfs.pin.add(request.avatar.hash);
      // TODO: Unpin old avatar if pinned successfully
      // Add new avatar metadata to user
      user.avatar = request.avatar;
    }

    // TODO: Handle
    // TODO: Name
    // TODO: Description

    // Save user
    await user.save();
    // TODO: as PutUserResponse
    res.status(StatusCode.OK).json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

export default router;
