import {
  BadRequest,
  DeleteVideoRequest,
  ErrorMessage,
  GetVideoRequest,
  GetVideoResponse,
  NotFound,
  pick,
  PostVideoRequest,
  PostVideoResponse,
  PutVideoRequest,
  PutVideoRequestParams,
  PutVideoViewRequestParams,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video as VideoCollection } from "@src/entities/Video";
import { isValidBody } from "@src/middleware";
import { isAuthenticated } from "@src/middleware/auth";
import { validateCursorRequest } from "@src/middleware/listing";
import {
  validatePostVideo,
  validatePutVideo,
  validateVideoExists
} from "@src/middleware/video";
import { projection } from "@src/util";
import { Router } from "express";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";
import { preAlphaFillListing } from "@src/util/cursor";

const router = Router();

/**
 * GET /video/:id
 */
router.get("/:id", async (req, res, next) => {
  const params = req.params as GetVideoRequest;

  if (!Types.ObjectId.isValid(params.id)) {
    throw new BadRequest(ErrorMessage.INVALID_OBJECT_ID);
  }

  const video = (
    await VideoCollection.aggregate()
      .match({
        _id: { $eq: new Types.ObjectId(params.id) }
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
  )[0] as Video;

  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  res.status(StatusCode.OK).json(video as GetVideoResponse);
});

/**
 * POST /video
 */
router.post(
  "/",
  isAuthenticated,
  validatePostVideo,
  (req, res, next) => {
    isValidBody(keysOf<PostVideoRequest>(), req, res, next);
  },
  async (req, res, next) => {
    const request = req.body as PostVideoRequest;

    // Get the channel we're uploading to
    const channel = await Channel.findById(request.channel);

    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    // Create and save the video
    const video = new VideoCollection({
      content: request.content,
      title: request.title,
      releaseDate: Date.now(),
      duration: request.duration,
      channel: request.channel,
      thumbnail: request.thumbnail
    });
    await video.save();

    // Add the video to the channel
    channel.videos.push(video._id);
    channel.save();

    res
      .status(StatusCode.CREATED)
      .json(pick(video.toJSON(), keysOf<Video>()) as PostVideoResponse);
  }
);

/*
 * PUT /video/:id
 */
router.put(
  "/:id",
  isAuthenticated,
  (req, res, next) => {
    isValidBody(keysOf<PutVideoRequest>(), req, res, next);
  },
  validatePutVideo,
  async (req, res, next) => {
    const body = req.body as PutVideoRequest;
    const params = req.params as PutVideoRequestParams;

    await VideoCollection.findByIdAndUpdate(params.id, body);

    res.sendStatus(StatusCode.CREATED);
  }
);

/*
 * PUT /video/:id/view
 */
router.put("/:id/view", validateVideoExists, async (req, res, next) => {
  const params = req.params as PutVideoViewRequestParams;

  const video = await VideoCollection.findById(params.id);

  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  video.views += 1;
  video.save();

  res.sendStatus(StatusCode.CREATED);
});

/*
 * DELETE /video/:id
 */
router.delete(
  "/:id",
  isAuthenticated,
  validateVideoExists,
  async (req, res, next) => {
    const request = req.params as DeleteVideoRequest;

    await VideoCollection.findByIdAndRemove(request.id);

    res.sendStatus(StatusCode.NO_CONTENT);
  }
);

/**
 * GET /video/:id/listing/related
 */
router.get(
  "/:id/listing/related",
  validateCursorRequest,
  async (req, res, next) => {
    let videos = (await VideoCollection.aggregate()
      .match({ _id: { $gt: req.cursor } })
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

export default router;
