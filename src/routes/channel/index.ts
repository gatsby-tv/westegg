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
  GetChannelVideosRequestQuery,
  GetChannelVideosResponse,
  GetChannelPlaylistsRequest,
  GetChannelPlaylistsRequestQuery,
  GetChannelPlaylistsResponse,
  GetChannelShowsRequest,
  GetChannelShowsRequestQuery,
  GetChannelShowsResponse,
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
import { isMongoDuplicateKeyError, projection } from "@src/utilities";
import { CURSOR_START, DEFAULT_CURSOR_LIMIT } from "@src/routes/listing";
import * as Express from "express-serve-static-core";
import { Request } from "express";

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
interface GetChannelVideosRequestQueryParams
  extends Record<keyof GetChannelVideosRequestQuery, string>,
    Express.Query {}
router.get(
  "/:id/videos",
  async (
    req: Request<
      GetChannelVideosRequestParams,
      GetChannelVideosResponse,
      {},
      GetChannelVideosRequestQueryParams
    >,
    res,
    next
  ) => {
    const params = req.params;
    const query = req.query;
    const limit: number = Number(query.limit || DEFAULT_CURSOR_LIMIT);
    if (!limit) {
      throw new BadRequest(ErrorMessage.BAD_REQUEST);
    }
    const cursor: Types.ObjectId = query.cursor
      ? new Types.ObjectId(query.cursor)
      : CURSOR_START;
    let videos = (await VideoCollection.aggregate()
      .match({
        _id: { $gt: cursor || CURSOR_START },
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
      .limit(limit)) as Video[];

    // Start pre-alpha demo code block
    let duplicate = Array(limit - videos.length)
      .fill(null)
      .map((item, index) => {
        return videos[index % videos.length];
      });

    // Wrap content as single request will have all that's in pre-alpha
    const nextCursor = CURSOR_START.toString();

    videos = [...videos, ...duplicate];
    // End pre-alpha demo code block

    const response = {
      content: videos,
      cursor: nextCursor,
      limit: limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

/**
 * GET /channel/:id/playlists
 */
interface GetChannelPlaylistsRequestParams
  extends Record<keyof GetChannelPlaylistsRequest, string>,
    Express.ParamsDictionary {}
interface GetChannelPlaylistsRequestQueryParams
  extends Record<keyof GetChannelPlaylistsRequestQuery, string>,
    Express.Query {}
router.get(
  "/:id/playlists",
  async (
    req: Request<
      GetChannelPlaylistsRequestParams,
      GetChannelPlaylistsResponse,
      {},
      GetChannelPlaylistsRequestQueryParams
    >,
    res,
    next
  ) => {
    const query = req.query;
    const limit: number = Number(query.limit || DEFAULT_CURSOR_LIMIT);
    const cursor: Types.ObjectId = query.cursor
      ? new Types.ObjectId(query.cursor)
      : CURSOR_START;
    // Return empty, not yet implemented
    const response = {
      content: [],
      cursor: cursor.toString(),
      limit: limit
    };
    res.status(StatusCode.OK).json(response);
  }
);

/**
 * GET /channel/:id/shows
 */
interface GetChannelShowsRequestParams
  extends Record<keyof GetChannelShowsRequest, string>,
    Express.ParamsDictionary {}
interface GetChannelShowsRequestQueryParams
  extends Record<keyof GetChannelShowsRequestQuery, string>,
    Express.Query {}
router.get(
  "/:id/shows",
  async (
    req: Request<
      GetChannelShowsRequestParams,
      GetChannelShowsResponse,
      {},
      GetChannelShowsRequestQueryParams
    >,
    res,
    next
  ) => {
    const query = req.query;
    const limit: number = Number(query.limit || DEFAULT_CURSOR_LIMIT);
    const cursor: Types.ObjectId = query.cursor
      ? new Types.ObjectId(query.cursor)
      : CURSOR_START;
    // Return empty, not yet implemented
    const response = {
      content: [],
      cursor: cursor.toString(),
      limit: limit
    };
    res.status(StatusCode.OK).json(response);
  }
);

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
