import {
  BadRequest,
  ErrorMessage,
  GetChannelAccountRequest,
  GetChannelAccountResponse,
  GetChannelContentRequest,
  GetChannelContentResponse,
  GetChannelHandleExistsRequest,
  GetChannelHandleExistsResponse,
  IVideo,
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
  StatusCode
} from "@gatsby-tv/types";
import { NextFunction, Request, Response, Router } from "express";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";

import { Channel } from "@src/entities/Channel";
import { User } from "@src/entities/User";
import { Video } from "@src/entities/Video";
import { isValidBody } from "@src/middleware";
import { isAuthenticated } from "@src/middleware/auth";
import {
  hasPermissionToPutChannelRequest,
  validatePostChannel,
  validatePutChannelHandleRequest
} from "@src/middleware/channel";
import { upload } from "@src/middleware/multipart";
import { isMongoDuplicateKeyError, projection } from "@src/utilities";
import {
  commitTransaction,
  startTransaction
} from "@src/middleware/transaction";

const router = Router();

/**
 * GET /channel/{:id, :handle}
 */
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (req, res, next) => {
    try {
      const params = req.params as GetChannelAccountRequest;

      let channel;
      try {
        const id = new Types.ObjectId(params.unique);
        channel = await Channel.findById(
          id,
          projection(keysOf<GetChannelAccountResponse>())
        );
      } catch (error) {
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
  //startTransaction,
  (req: Request, res: Response, next: NextFunction) => {
    isValidBody(keysOf<PostChannelRequest>(), req, res, next);
  },
  validatePostChannel,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

/**
 * GET /channel/:handle/exists
 */
router.get("/:handle/exists", async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /channel/:id/content
 */
router.get("/:id/content", async (req, res, next) => {
  try {
    const params = req.params as GetChannelContentRequest;
    const channel = await Channel.findById(params.id);
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    // Get all channel content from FKs stored on channel (build a mongo query for each content item)
    // TODO: Videos
    const videos = (
      await Video.find().where("_id").in(channel.videos).exec()
    ).map((entity) => entity as IVideo);
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
  //startTransaction,
  (req: Request, res: Response, next: NextFunction) => {
    isValidBody(keysOf<PutChannelHandleRequest>(), req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

/**
 * PUT /channel/:id/avatar
 */
router.put(
  "/:id/avatar",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  //startTransaction,
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, next, 2);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as PutChannelAvatarRequestParams;
      const channel = await Channel.findById(
        params.id,
        projection(keysOf<PutChannelAvatarResponse>())
      );
      if (!channel) {
        throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
      }

      // TODO: Unpin the old avatar unless used by another channel
      channel.avatar = req.ipfsContent!;
      channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelAvatarResponse);
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

/**
 * PUT /channel/:id/banner
 */
router.put(
  "/:id/banner",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  //startTransaction,
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, next, 2);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as PutChannelBannerRequestParams;
      const channel = await Channel.findById(
        params.id,
        projection(keysOf<PutChannelBannerResponse>())
      );
      if (!channel) {
        throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
      }

      // TODO: Unpin the old banner unless used by another channel
      channel.banner = req.ipfsContent!;
      channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelBannerResponse);
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

/**
 * PUT /channel/:id/poster
 */
router.put(
  "/:id/poster",
  isAuthenticated,
  hasPermissionToPutChannelRequest,
  //startTransaction,
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, next, 2);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as PutChannelPosterRequestParams;
      const channel = await Channel.findById(
        params.id,
        projection(keysOf<PutChannelPosterResponse>())
      );
      if (!channel) {
        throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
      }

      // TODO: Unpin the old poster unless used by another channel
      channel.poster = req.ipfsContent!;
      channel.save();

      res
        .status(StatusCode.CREATED)
        .json(channel.toJSON() as PutChannelPosterResponse);
      next();
    } catch (error) {
      next(error);
    }
  }
  //commitTransaction
);

export default router;
