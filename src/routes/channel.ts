import {
  ErrorMessage,
  GetChannelAccountRequest,
  GetChannelAccountResponse,
  GetChannelContentRequest,
  GetChannelContentResponse,
  IVideo,
  NotFound,
  PostChannelRequest,
  PostChannelResponse,
  PutChannelAvatarRequestParams,
  PutChannelAvatarResponse,
  PutChannelBannerRequestParams,
  PutChannelBannerResponse,
  PutChannelHandleRequest,
  PutChannelHandleResponse,
  PutChannelPosterRequestParams,
  PutChannelPosterResponse,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import { Types } from "mongoose";
import { getCachedChannelById } from "../cache";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";
import { Video } from "../entities/Video";
import { isAuthenticated } from "../middleware/auth";
import {
  hasPermissionToPutChannelRequest,
  validatePostChannel,
  validatePutChannelHandleRequest
} from "../middleware/channel";
import { upload } from "../middleware/multipart";

const router = Router();

/**
 * GET /channel/{:id, :handle}
 */
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (req, res, next) => {
    try {
      const request = req.params as GetChannelAccountRequest;

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

      res
        .status(StatusCode.OK)
        .json(channel.toJSON() as GetChannelAccountResponse);
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

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PostChannelResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /channel/:id/content
 */
router.get("/:id/content", async (req, res, next) => {
  try {
    const request = req.params as GetChannelContentRequest;
    const channel = await getCachedChannelById(request.id);

    // Get all channel content from FKs stored on channel (build a mongo query for each content item)
    // TODO: Videos
    const videos = (
      await Video.find().where("_id").in(channel.videos).exec()
    ).map((entity) => entity as IVideo);
    console.log(videos);
    // TODO: Shows
    // TODO: Playlists

    // TODO: Unimplemented, return empty for now
    let response = {
      _id: channel._id,
      videos: [],
      shows: [],
      playlists: []
    } as GetChannelContentResponse;

    res.status(StatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /channel/:id/handle
 */
router.put(
  "/:id/handle",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  validatePutChannelHandleRequest,
  async (req, res, next) => {
    try {
      const request = req.body as PutChannelHandleRequest;
      const channel = await getCachedChannelById(req.params.id);

      channel.handle = request.handle;
      await channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelHandleResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /channel/:id/avatar
 */
router.put(
  "/:id/avatar",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  upload,
  async (req, res, next) => {
    try {
      const request = req.params as PutChannelAvatarRequestParams;
      const channel = await getCachedChannelById(request.id);

      // TODO: Unpin the old avatar unless used by another channel
      channel.avatar = req.ipfsContent!;
      channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelAvatarResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /channel/:id/banner
 */
router.put(
  "/:id/banner",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  upload,
  async (req, res, next) => {
    try {
      const request = req.params as PutChannelBannerRequestParams;
      const channel = await getCachedChannelById(request.id);

      // TODO: Unpin the old banner unless used by another channel
      channel.banner = req.ipfsContent!;
      channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelBannerResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /channel/:id/poster
 */
router.put(
  "/:id/poster",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  upload,
  async (req, res, next) => {
    try {
      const request = req.params as PutChannelPosterRequestParams;
      const channel = await getCachedChannelById(request.id);

      // TODO: Unpin the old poster unless used by another channel
      channel.poster = req.ipfsContent!;
      channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelPosterResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
