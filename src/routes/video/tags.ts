import {
  BadRequest,
  DeleteTagsRequest,
  DeleteTagsRequestParams,
  ErrorMessage,
  GetTagsRequest,
  GetTagsResponse,
  NotFound,
  PostTagsRequest,
  PostTagsRequestParams,
  StatusCode
} from "@gatsby-tv/types";
import { Video as VideoCollection } from "@src/entities/Video";
import { validateTag } from "@src/middleware/tags";
import { Router } from "express";
import { Types } from "mongoose";

const router = Router();

router.get("/:id/tags", async (req, res, next) => {
  const params = req.params as GetTagsRequest;

  if (!Types.ObjectId.isValid(params.id)) {
    throw new BadRequest(ErrorMessage.INVALID_OBJECT_ID);
  }

  const video = await VideoCollection.findById(params.id);

  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  res.status(StatusCode.OK).json(video.tags as GetTagsResponse);
});

router.post("/:id/tags", async (req, res, next) => {
  const params = req.params as PostTagsRequestParams;
  const body = req.body as PostTagsRequest;

  if (!Types.ObjectId.isValid(params.id)) {
    throw new BadRequest(ErrorMessage.INVALID_OBJECT_ID);
  }

  const video = await VideoCollection.findById(params.id);

  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  body.tags.forEach((tag) => validateTag(tag));

  video.tags = [...new Set([...video.tags, ...body.tags])];
  video.save();

  res.sendStatus(StatusCode.CREATED);
});

router.delete("/:id/tags", async (req, res, next) => {
  const params = req.params as DeleteTagsRequestParams;
  const body = req.body as DeleteTagsRequest;

  if (!Types.ObjectId.isValid(params.id)) {
    throw new BadRequest(ErrorMessage.INVALID_OBJECT_ID);
  }

  const video = await VideoCollection.findById(params.id);

  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  video.tags = video.tags.filter((tag: string) => !body.tags.includes(tag));
  video.save();

  res.sendStatus(StatusCode.OK);
});

export default router;
