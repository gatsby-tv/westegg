import {
  ErrorMessage,
  GetVideoRequest,
  NotFound,
  PostVideoRequest,
  StatusCode
} from "@gatsby-tv/types";
import { Request, Router } from "express";
import * as ExpressCore from "express-serve-static-core";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";
import { isAuthenticated } from "../middleware/auth";
import { validatePostVideo } from "../middleware/video";

const router = Router();

/**
 * GET /video/:hash
 */
interface GetVideoRequestParams
  extends ExpressCore.ParamsDictionary,
    GetVideoRequest {}
router.get(
  "/:id",
  async (req: Request<GetVideoRequestParams, {}, {}, {}>, res, next) => {
    try {
      // TODO: as GetVideoRequest
      const request = req.params;

      const video = await Video.findById(request.id);

      if (!video) {
        throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
      }

      // TODO: as GetVideoRequest
      res.status(StatusCode.OK).json(video.toJSON());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /video
 */
router.post("/", isAuthenticated, validatePostVideo, async (req, res, next) => {
  try {
    const request: PostVideoRequest = req.body;

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

    // TODO: as PostVideoResponse
    res.status(StatusCode.CREATED).json(video.toJSON());
  } catch (error) {
    next(error);
  }
});

export default router;
