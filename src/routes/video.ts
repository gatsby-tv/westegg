import {
  DeleteVideoRequest,
  ErrorMessage,
  GetVideoRequest,
  NotFound,
  pick,
  PostVideoRequest,
  PostVideoResponse,
  PutVideoRequest,
  PutVideoRequestParams,
  PutVideoViewRequestParams,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import { keys as keysOf } from "ts-transformer-keys";

import { Channel } from "@src/entities/Channel";
import { Video } from "@src/entities/Video";
import { isValidBody } from "@src/middleware";
import { isAuthenticated } from "@src/middleware/auth";
import {
  validatePostVideo,
  validatePutVideo,
  validateVideoExists
} from "@src/middleware/video";
import { projection } from "@src/utilities";
import { useTransaction } from "@src/middleware/transaction";

const router = Router();

/**
 * GET /video/:hash
 */
router.get("/:id", async (req, res, next) => {
  try {
    const request = req.params as GetVideoRequest;

    const video = await Video.findById(
      request.id,
      projection(keysOf<GetVideoRequest>())
    );

    if (!video) {
      throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
    }

    res.status(StatusCode.OK).json(video.toJSON() as GetVideoRequest);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /video
 */
router.post(
  "/",
  isAuthenticated,
  validatePostVideo,
  useTransaction,
  (req, res, next) => {
    isValidBody(keysOf<PostVideoRequest>(), req, res, next);
  },
  async (req, res, next) => {
    try {
      const request = req.body as PostVideoRequest;

      // Get the channel we're uploading to
      const channel = await Channel.findById(request.channel);

      if (!channel) {
        throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
      }

      // Create and save the video
      // TODO: Include optional fields
      const video = new Video({
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
        .json(
          pick(video.toJSON(), keysOf<PostVideoRequest>()) as PostVideoResponse
        );
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PUT /video/:id
 */
router.put(
  "/:id",
  isAuthenticated,
  useTransaction,
  (req, res, next) => {
    isValidBody(keysOf<PutVideoRequest>(), req, res, next);
  },
  validatePutVideo,
  async (req, res, next) => {
    try {
      const body = req.body as PutVideoRequest;
      const params = req.params as PutVideoRequestParams;

      await Video.findByIdAndUpdate(params.id, body);

      res.sendStatus(StatusCode.CREATED);
    } catch (error) {
      next(error);
    }
  }
);

/*
 * PUT /video/:id/view
 */
router.put(
  "/:id/view",
  isAuthenticated,
  validateVideoExists,
  useTransaction,
  async (req, res, next) => {
    try {
      const params = req.params as PutVideoViewRequestParams;

      const video = await Video.findById(params.id);

      if (!video) {
        throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
      }

      video.views += 1;
      video.save();

      res.sendStatus(StatusCode.CREATED);
    } catch (error) {
      next(error);
    }
  }
);

/*
 * DELETE /video/:id
 */
router.delete(
  "/:id",
  isAuthenticated,
  validateVideoExists,
  useTransaction,
  async (req, res, next) => {
    try {
      const request = req.params as DeleteVideoRequest;

      await Video.findByIdAndRemove(request.id);

      res.sendStatus(StatusCode.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
