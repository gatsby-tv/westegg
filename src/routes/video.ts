import {
  ErrorMessage,
  GetVideoRequest,
  NotFound,
  PostVideoRequest,
  PostVideoResponse,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";
import { isAuthenticated } from "../middleware/auth";
import { validatePostVideo } from "../middleware/video";

const router = Router();

/**
 * GET /video/:hash
 */
router.get("/:id", async (req, res, next) => {
  try {
    const request = req.params as GetVideoRequest;

    const video = await Video.findById(request.id);

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
router.post("/", isAuthenticated, validatePostVideo, async (req, res, next) => {
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

    res.status(StatusCode.CREATED).json(video.toJSON() as PostVideoResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
