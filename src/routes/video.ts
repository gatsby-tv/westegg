import { Router } from "express";
import { isAuthenticated, ownsChannel } from "../middleware/auth";
import {
  GetVideoListRequest,
  GetVideoRequest,
  UploadVideoRequest
} from "../requestTypes";
import { validateVideoUpload } from "../middleware/video";
import { IVideo, Video } from "../entities/Video";
import { Uploadable } from "../entities/Uploadable";
import {
  ErrorResponse,
  GetVideoListResponse,
  GetVideoResponse,
  UploadVideoResponse
} from "../responseTypes";
import { ErrorCode, WestEggError } from "../errors";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  ownsChannel,
  validateVideoUpload,
  async (req, res) => {
    try {
      const request: UploadVideoRequest = req.body;

      // Get the uploadable we're uploading to
      const uploadable = await Uploadable.findOne({ _id: request.uploadable });

      // Create and save the video
      const video = await Video.create({
        title: request.title,
        description: request.description,
        views: 0,
        dateUploaded: Date.now(),
        hash: request.hash,
        thumbnailHash: request.thumbnailHash,
        uploadable: uploadable?._id
      });
      await video.save();

      res.status(201).json(video.toJSON() as UploadVideoResponse);
    } catch (error) {
      return res.status(400).json({ error } as ErrorResponse);
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const request: GetVideoRequest = req.body;

    let video;
    if (request.id) {
      video = await Video.findById(request.id);
    } else {
      video = await Video.findOne({ hash: request.hash });
    }

    // If we don't find the Video
    if (!video) {
      return res.status(404).json({
        error: new WestEggError(ErrorCode.NOT_FOUND, "Video not found!")
      } as ErrorResponse);
    }

    // Video found
    return res.status(200).json(video.toJSON() as GetVideoResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

router.get("/list", async (req, res) => {
  try {
    const request: GetVideoListRequest = req.body;

    let videos: IVideo[] = [];

    // Client wants Videos with specific values
    if (request.filter) {
      const filter = request.filter;
      videos = await Video.where(filter.key, filter.value)
        .skip(request.page)
        .limit(request.perPage);
    } else {
      videos = await Video.find().skip(request.page).limit(request.perPage);
    }

    return res.status(200).json({
      videos,
      page: request.page,
      perPage: request.perPage
    } as GetVideoListResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

export default router;
