import {
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosRequest,
  GetListingNewVideosResponse,
  GetListingPopularVideosRequest,
  GetListingPopularVideosResponse,
  IChannelAccount,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video as VideoCollection } from "@src/entities/Video";
import { validateCursorRequest } from "@src/middleware/listing";
import { projection } from "@src/utilities";
import { Router } from "express";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";

const router = Router();
export const DEFAULT_CURSOR_LIMIT = 24;
export const CURSOR_START = new Types.ObjectId("0".repeat(24));

/**
 * GET /listing/featured/channels
 */
router.get("/featured/channels", async (req, res, next) => {
  const channels = await Channel.find(
    {},
    projection(keysOf<Omit<IChannelAccount, "_id">>())
  ).limit(DEFAULT_CURSOR_LIMIT);

  res
    .status(StatusCode.OK)
    .json(channels as GetListingFeaturedChannelsResponse);
});

/**
 * GET /listing/videos/popular
 */
router.get("/videos/popular", validateCursorRequest, async (req, res, next) => {
  const body = req.body as GetListingPopularVideosRequest;
  const limit = body.limit || DEFAULT_CURSOR_LIMIT;
  const cursor = body.cursor ? new Types.ObjectId(body.cursor) : CURSOR_START;
  let videos = await VideoCollection.aggregate()
    .match({ _id: { $gt: cursor } })
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
    .limit(limit);

  let duplicate = Array(limit - videos.length)
    .fill(null)
    .map((item, index) => {
      console.log(index);
      return videos[index % videos.length];
    });
  videos = [...videos, ...duplicate];

  const response = {
    content: videos,
    cursor: videos[videos.length - 1]?._id,
    limit: limit
  };

  res.status(StatusCode.OK).json(response as GetListingPopularVideosResponse);
});

/**
 * GET /listing/videos/new
 */
router.get("/videos/new", validateCursorRequest, async (req, res, next) => {
  const body = req.body as GetListingNewVideosRequest;
  const limit = body.limit || DEFAULT_CURSOR_LIMIT;
  const cursor = body.cursor ? new Types.ObjectId(body.cursor) : CURSOR_START;
  let videos = await VideoCollection.aggregate()
    .match({ _id: { $gt: cursor || CURSOR_START } })
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
    .limit(limit);

  let duplicate = Array(limit - videos.length)
    .fill(null)
    .map((item, index) => {
      console.log(index);
      return videos[index % videos.length];
    });
  videos = [...videos, ...duplicate];

  const response = {
    content: videos,
    cursor: videos[videos.length - 1]?._id,
    limit: limit
  };

  res.status(StatusCode.OK).json(response as GetListingNewVideosResponse);
});

export default router;
