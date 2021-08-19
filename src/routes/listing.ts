import {
  Browsable,
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosRequest,
  GetListingNewVideosResponse,
  GetListingPopularVideosRequest,
  GetListingPopularVideosResponse,
  GetUserListingRecommendedRequest,
  GetUserListingRecommendedResponse,
  GetUserListingSubscriptionsRequest,
  GetUserListingSubscriptionsResponse,
  IChannelAccount,
  StatusCode
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video } from "@src/entities/Video";
import { projection } from "@src/utilities";
import { Router } from "express";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";

const router = Router();
const DEFAULT_CURSOR_LIMIT = 12;
const CURSOR_START = new Types.ObjectId("0".repeat(24));

/**
 * GET /listing/featured/channels
 */
router.get("/featured/channels", async (req, res, next) => {
  try {
    // TODO: Should get actual list of featured channels
    const channels = await Channel.find(
      {},
      projection(keysOf<Omit<IChannelAccount, "_id">>())
    ).limit(DEFAULT_CURSOR_LIMIT);

    res
      .status(StatusCode.OK)
      .json(channels as GetListingFeaturedChannelsResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/videos/recommended
 */
router.get("/videos/recommended", async (req, res, next) => {
  try {
    const body = req.body as GetUserListingRecommendedRequest;
    const limit = body.limit || DEFAULT_CURSOR_LIMIT;
    const cursor = body.cursor ? new Types.ObjectId(body.cursor) : CURSOR_START;

    const videos = await Video.aggregate()
      .match({
        _id: { $gt: cursor }
      })
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
      .project(projection(keysOf<Browsable>()))
      .limit(limit);

    const response = {
      content: videos,
      cursor: videos[videos.length - 1]._id || CURSOR_START,
      limit: limit
    };

    res
      .status(StatusCode.OK)
      .json(response as GetUserListingRecommendedResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/videos/popular
 */
router.get("/videos/popular", async (req, res, next) => {
  try {
    const body = req.body as GetListingPopularVideosRequest;
    const limit = body.limit || DEFAULT_CURSOR_LIMIT;
    const cursor = body.cursor ? new Types.ObjectId(body.cursor) : CURSOR_START;
    const videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()))
      .limit(limit);

    const response = {
      content: videos,
      cursor: videos[videos.length - 1]._id || CURSOR_START,
      limit: limit
    };

    res.status(StatusCode.OK).json(response as GetListingPopularVideosResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/videos/new
 */
router.get("/videos/new", async (req, res, next) => {
  try {
    const body = req.body as GetListingNewVideosRequest;
    const limit = body.limit || DEFAULT_CURSOR_LIMIT;
    const cursor = body.cursor ? new Types.ObjectId(body.cursor) : CURSOR_START;
    const videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()))
      .limit(limit);

    const response = {
      content: videos,
      cursor: videos[videos.length - 1]._id || CURSOR_START,
      limit: limit
    };

    res.status(StatusCode.OK).json(response as GetListingNewVideosResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/subscriptions
 */
router.get("/subscriptions", async (req, res, next) => {
  try {
    const body = req.body as GetUserListingSubscriptionsRequest;
    const limit = body.limit || DEFAULT_CURSOR_LIMIT;
    const cursor = body.cursor ? new Types.ObjectId(body.cursor) : CURSOR_START;
    const videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()))
      .limit(limit);

    const response = {
      content: videos,
      cursor: videos[videos.length - 1]._id || CURSOR_START,
      limit: limit
    };

    res
      .status(StatusCode.OK)
      .json(response as GetUserListingSubscriptionsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
