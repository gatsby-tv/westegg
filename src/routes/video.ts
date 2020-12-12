import { Router } from "express";
import { isAuthenticated, ownsChannel } from "../middleware/auth";
import { UploadVideoRequest } from "../requestTypes";
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
    if (!req.query.id && !req.query.hash) {
      throw new WestEggError(ErrorCode.BAD_REQUEST, "No id or hash specified!");
    }

    let video;
    if (req.query.id) {
      video = await Video.findById(req.query.id as string);
    } else {
      video = await Video.findOne({ hash: req.query.hash! as string });
    }

    // If we don't find the Video
    if (!video) {
      return res.status(404).json({
        error: new WestEggError(ErrorCode.NOT_FOUND, "Video not found!")
      } as ErrorResponse);
    }

    // Video found
    // Increment view count (temporary for pre-alpha)
    // Don't wait for the save to finish intentionally
    video.views++;
    video.save();
    return res.status(200).json(video.toJSON() as GetVideoResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

router.get("/list", async (req, res) => {
  try {
    let page, perPage;
    if (!req.query.page && !req.query.perPage) {
      throw new WestEggError(
        ErrorCode.BAD_REQUEST,
        "No page or perPage specified!"
      );
    } else {
      page = parseInt(req.query.page! as string);
      perPage = parseInt(req.query.perPage! as string);
    }

    let videos: IVideo[] = [];

    // Client wants videos with specific values
    if (req.query.filterKey && req.query.filterValue) {
      const filter = {
        key: req.query.filterKey as string,
        value: req.query.filterValue as string
      };
      videos = await Video.where(filter.key, filter.value)
        .skip(page)
        .limit(perPage);
    } else {
      videos = await Video.find().skip(page).limit(perPage);
    }

    return res.status(200).json({
      videos,
      page: page,
      perPage: perPage
    } as GetVideoListResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

export default router;
