import {
  ErrorMessage,
  GetChannelAccountRequest,
  NotFound,
  PostChannelRequest,
  StatusCode
} from "@gatsby-tv/types";
import { Request, Router } from "express";
import * as ExpressCore from "express-serve-static-core";
import { Types } from "mongoose";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";
import { isAuthenticated } from "../middleware/auth";
import { validatePostChannel } from "../middleware/channel";

const router = Router();

/**
 * GET /chanel/{:id, :handle}
 */
interface GetChannelAccountRequestParams
  extends ExpressCore.ParamsDictionary,
    GetChannelAccountRequest {}
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (
    req: Request<GetChannelAccountRequestParams, {}, {}, {}>,
    res,
    next
  ) => {
    try {
      // TODO: as GetChannelAccountRequest
      const request = req.params;

      let channel;
      try {
        const id = new Types.ObjectId(request.unique);
        channel = await Channel.findById(id);
      } catch (error) {
        // Not a mongo object id, try with handle
        channel = await Channel.findOne({ handle: request.unique });
      }

      if (!channel) {
        throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
      }

      // TODO: as GetChannelAccountRequest
      res.status(StatusCode.OK).json(channel.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /channel
 */
router.post(
  "/",
  isAuthenticated,
  validatePostChannel,
  async (req, res, next) => {
    try {
      const request: PostChannelRequest = req.body;

      // Get the user making the request
      const user = await User.findById(request.owner);

      if (!user) {
        throw new NotFound(ErrorMessage.USER_NOT_FOUND);
      }

      // Create the new channel
      const channel = new Channel({
        handle: request.handle,
        name: request.name,
        creationDate: Date.now(),
        owners: [user._id]
      });
      await channel.save();

      // Update the user with the channel FK
      user.channels.push(channel._id);
      user.save();

      // TODO: as PostChannelResponse
      res.status(StatusCode.CREATED).json(channel.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
