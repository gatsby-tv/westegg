import {
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosRequest,
  GetListingNewVideosResponse,
  GetListingNewVideosRequestQuery,
  GetListingPopularVideosRequest,
  GetListingPopularVideosRequestQuery,
  GetListingPopularVideosResponse,
  IChannelAccount,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video as VideoCollection } from "@src/entities/Video";
import { validateCursorRequest } from "@src/middleware/listing";
import { projection } from "@src/utilities";
import { Router, Request } from "express";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";
import * as Express from "express-serve-static-core";

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
interface GetListingPopularVideosRequestParams
  extends Record<keyof GetListingPopularVideosRequest, string>,
    Express.ParamsDictionary {}
interface GetListingPopularVideosRequestQueryParams
  extends Record<keyof GetListingPopularVideosRequestQuery, string>,
    Express.Query {}
router.get(
  "/videos/popular",
  validateCursorRequest,
  async (
    req: Request<
      GetListingPopularVideosRequestParams,
      GetListingPopularVideosResponse,
      {},
      GetListingPopularVideosRequestQueryParams
    >,
    res,
    next
  ) => {
    const query = req.query;
    const limit: number = Number(query.limit || DEFAULT_CURSOR_LIMIT);
    const cursor: Types.ObjectId = query.cursor
      ? new Types.ObjectId(query.cursor)
      : CURSOR_START;
    let videos = (await VideoCollection.aggregate()
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
      .limit(limit)) as Video[];

    let duplicate = Array(limit - videos.length)
      .fill(null)
      .map((item, index) => {
        return videos[index % videos.length];
      });
    videos = [...videos, ...duplicate];

    const response = {
      content: videos,
      cursor: videos[videos.length - 1]?._id,
      limit: limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

/**
 * GET /listing/videos/new
 */
interface GetListingNewVideosRequestParams
  extends Record<keyof GetListingNewVideosRequest, string>,
    Express.ParamsDictionary {}
interface GetListingNewVideosRequestQueryParams
  extends Record<keyof GetListingNewVideosRequestQuery, string>,
    Express.Query {}
router.get(
  "/videos/new",
  validateCursorRequest,
  async (
    req: Request<
      GetListingNewVideosRequestParams,
      GetListingNewVideosResponse,
      {},
      GetListingNewVideosRequestQueryParams
    >,
    res,
    next
  ) => {
    const query = req.query;
    const limit: number = Number(query.limit || DEFAULT_CURSOR_LIMIT);
    const cursor: Types.ObjectId = query.cursor
      ? new Types.ObjectId(query.cursor)
      : CURSOR_START;
    let videos = (await VideoCollection.aggregate()
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
      .limit(limit)) as Video[];

    let duplicate = Array(limit - videos.length)
      .fill(null)
      .map((item, index) => {
        return videos[index % videos.length];
      });
    videos = [...videos, ...duplicate];

    const response = {
      content: videos,
      cursor: videos[videos.length - 1]?._id,
      limit: limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

export default router;
