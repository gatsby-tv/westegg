import { Router } from "express";
import { isAuthenticated, ownsChannel } from "../middleware/auth";
import { UploadVideoRequest } from "../types";
import { validateVideoUpload } from "../middleware/video";
import { Video } from "../entities/Video";
import { Uploadable } from "../entities/Uploadable";

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

      res.sendStatus(201);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
);

export default router;
