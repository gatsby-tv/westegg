import { ErrorMessage, NotFound, PostVideoRequest } from "@gatsby-tv/types";
import { Router } from "express";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";
import { isAuthenticated } from "../middleware/auth";
import { validatePostVideo } from "../middleware/video";

const router = Router();

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
      title: request.title,
      releaseDate: Date.now(),
      duration: request.duration,
      content: request.content,
      channel: request.channel,
      thumbnail: request.thumbnail
    });
    await video.save();

    // Add the video to the channel
    channel.videos.push(video._id);
    channel.save();

    // TODO: as PostVideoResponse
    res.status(201).json(video.toJSON());
  } catch (error) {
    next(error);
  }
});

export default router;
