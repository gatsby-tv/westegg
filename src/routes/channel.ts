import { Router, Request } from "express";
import { User } from "../entities/User";
import {
  PostChannelRequest,
  NotFound,
  ErrorMessage,
  GetChannelAccountRequest,
  StatusCode
} from "@gatsby-tv/types";
import { isAuthenticated } from "../middleware/auth";
import { Channel } from "../entities/Channel";
import { validatePostChannel } from "../middleware/channel";
import * as ExpressCore from "express-serve-static-core";

const router = Router();

/**
 * GET /chanel/:handle
 */
interface GetChannelAccountRequestParams
  extends ExpressCore.ParamsDictionary,
    GetChannelAccountRequest {}
router.get(
  "/:handle",
  async (
    req: Request<GetChannelAccountRequestParams, {}, {}, {}>,
    res,
    next
  ) => {
    try {
      // TODO: as GetChannelAccountRequest
      const request = req.params;

      const channel = await Channel.findById(request.handle);

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
        _id: request.handle,
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
