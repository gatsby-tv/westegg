import {
  BadRequest,
  ErrorMessage,
  GetChannelAccountRequest,
  GetChannelAccountResponse,
  GetChannelContentRequest,
  GetChannelContentResponse,
  GetChannelHandleExistsRequest,
  GetChannelHandleExistsResponse,
  GetChannelVideosRequest,
  GetChannelVideosResponse,
  NotFound,
  pick,
  PostChannelRequest,
  PostChannelResponse,
  PutChannelAvatarRequestParams,
  PutChannelAvatarResponse,
  PutChannelBannerRequestParams,
  PutChannelBannerResponse,
  PutChannelHandleRequest,
  PutChannelHandleRequestParams,
  PutChannelHandleResponse,
  PutChannelPosterRequestParams,
  PutChannelPosterResponse,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Router } from "express";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";
import { Channel } from "@src/entities/Channel";
import { User } from "@src/entities/User";
import { Video as VideoCollection } from "@src/entities/Video";
import { isValidBody } from "@src/middleware";
import { isAuthenticated } from "@src/middleware/auth";
import {
  hasPermissionToPutChannelRequest,
  validatePostChannel,
  validatePutChannelHandleRequest
} from "@src/middleware/channel";
import { upload } from "@src/middleware/multipart";
import { isMongoDuplicateKeyError, projection } from "@src/util";
import * as Express from "express-serve-static-core";
import { Request } from "express";
import { preAlphaFillListing } from "@src/util/cursor";
import { validateCursorRequest } from "@src/middleware/listing";

const router = Router();

/**
 * GET /channel/{:id, :handle}
 */
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (req, res, next) => {
    const params = req.params as GetChannelAccountRequest;

    let channel;
    if (Types.ObjectId.isValid(params.unique)) {
      const id = new Types.ObjectId(params.unique);
      channel = await Channel.findById(
        id,
        projection(keysOf<GetChannelAccountResponse>())
      );
    } else {
      // Not a mongo object id, try with handle
      channel = await Channel.findOne(
        { handle: params.unique },
        projection(keysOf<GetChannelAccountResponse>())
      );
    }

    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    res
      .status(StatusCode.OK)
      .json(channel.toJSON() as GetChannelAccountResponse);
  }
);

/**
 * POST /channel
 */
router.post(
  "/",
  isAuthenticated,
  (req, res, next) => {
    isValidBody(keysOf<PostChannelRequest>(), req, res, next);
  },
  validatePostChannel,
  async (req, res, next) => {
    const body: PostChannelRequest = req.body;

    // Get the user making the request
    const user = await User.findById(body.owner);
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    // Create the new channel
    const channel = new Channel({
      handle: body.handle,
      name: body.name,
      creationDate: Date.now(),
      owners: [user._id]
    });
    try {
      await channel.save();
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
      }
      next(error);
    }

    // Update the user with the channel FK
    user.channels.push(channel._id);
    user.save();

    res
      .status(StatusCode.CREATED)
      .json(
        pick(
          channel.toJSON(),
          keysOf<PostChannelResponse>()
        ) as PostChannelResponse
      );
  }
);

/**
 * GET /channel/:handle/exists
 */
router.get("/:handle/exists", async (req, res, next) => {
  const params = req.params as GetChannelHandleExistsRequest;
  const channel = await Channel.findOne(
    { handle: params.handle },
    projection(keysOf<GetChannelHandleExistsResponse>())
  );

  if (!channel) {
    throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
  }

  res
    .status(StatusCode.OK)
    .json(channel.toJSON() as GetChannelHandleExistsResponse);
});

/**
 * GET /channel/:id/content
 */
router.get("/:id/content", async (req, res, next) => {
  const params = req.params as GetChannelContentRequest;
  const channel = await Channel.findById(params.id);
  if (!channel) {
    throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
  }

  // Unimplemented, return empty for now
  let response = {
    _id: channel._id,
    videos: [],
    shows: [],
    playlists: []
  } as GetChannelContentResponse;

  res.status(StatusCode.OK).json(response);
});

/**
 * Get /channel/:id/videos
 */
interface GetChannelVideosRequestParams
  extends Record<keyof GetChannelVideosRequest, string>,
    Express.ParamsDictionary {}
router.get(
  "/:id/videos",
  validateCursorRequest,
  async (
    req: Request<
      GetChannelVideosRequestParams,
      GetChannelVideosResponse,
      {},
      {}
    >,
    res,
    next
  ) => {
    const params = req.params;
    let videos = (await VideoCollection.aggregate()
      .match({
        _id: { $gt: req.cursor },
        channel: Types.ObjectId(params.id)
      })
      .lookup({
        from: Channel.collection.name,
        localField: "channel",
        foreignField: "_id",
        as: "channel"
      })
      .unwind({
        path: "$channel",
        preserveNullAndEmptyArrays: true
      })
      .project(projection(keysOf<Video>()))
      .limit(req.limit)) as Video[];

    const listing = preAlphaFillListing<Video>(videos, req.limit);

    const response = {
      content: listing.content,
      cursor: listing.next,
      limit: req.limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

/**
 * GET /channel/:id/playlists
 */
router.get("/:id/playlists", validateCursorRequest, async (req, res, next) => {
  // Return empty, not yet implemented
  const response = {
    content: [],
    cursor: req.cursor.toString(),
    limit: req.limit
  };
  res.status(StatusCode.OK).json(response);
});

/**
 * GET /channel/:id/shows
 */
router.get("/:id/shows", validateCursorRequest, async (req, res, next) => {
  // Return empty, not yet implemented
  const response = {
    content: [],
    cursor: req.cursor.toString(),
    limit: req.limit
  };
  res.status(StatusCode.OK).json(response);
});

/**
 * PUT /channel/:id/handle
 */
router.put(
  "/:id/handle",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  validatePutChannelHandleRequest,
  (req, res, next) => {
    isValidBody(keysOf<PutChannelHandleRequest>(), req, res, next);
  },
  async (req, res, next) => {
    const body = req.body as PutChannelHandleRequest;
    const params = req.params as PutChannelHandleRequestParams;
    const channel = await Channel.findById(
      params.id,
      projection(keysOf<PutChannelHandleResponse>())
    );
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    channel.handle = body.handle;
    try {
      await channel.save();
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
      }
      next(error);
    }

    res
      .status(StatusCode.CREATED)
      .json(channel.toJSON() as PutChannelHandleResponse);
  }
);

/**
 * PUT /channel/:id/avatar
 */
router.put(
  "/:id/avatar",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  (req, res, next) => {
    upload(req, res, next, 2);
  },
  async (req, res, next) => {
    const params = req.params as PutChannelAvatarRequestParams;
    const channel = await Channel.findById(
      params.id,
      projection(keysOf<PutChannelAvatarResponse>())
    );
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    channel.avatar = req.ipfsContent!;
    channel.save();

    res
      .status(StatusCode.CREATED)
      .json(channel.toJSON() as PutChannelAvatarResponse);
  }
);

/**
 * PUT /channel/:id/banner
 */
router.put(
  "/:id/banner",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  (req, res, next) => {
    upload(req, res, next, 2);
  },
  async (req, res, next) => {
    const params = req.params as PutChannelBannerRequestParams;
    const channel = await Channel.findById(
      params.id,
      projection(keysOf<PutChannelBannerResponse>())
    );
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    channel.banner = req.ipfsContent!;
    channel.save();

    res
      .status(StatusCode.CREATED)
      .json(channel.toJSON() as PutChannelBannerResponse);
  }
);

/**
 * PUT /channel/:id/poster
 */
router.put(
  "/:id/poster",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  (req, res, next) => {
    upload(req, res, next, 2);
  },
  async (req, res, next) => {
    const params = req.params as PutChannelPosterRequestParams;
    const channel = await Channel.findById(
      params.id,
      projection(keysOf<PutChannelPosterResponse>())
    );
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    channel.poster = req.ipfsContent!;
    channel.save();

    res
      .status(StatusCode.CREATED)
      .json(channel.toJSON() as PutChannelPosterResponse);
  }
);

export default router;
