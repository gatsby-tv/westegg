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
import { Types as MongooseTypes } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";

const router = Router();
const DEFAULT_CURSOR_LIMIT = 12;
const CURSOR_START = new MongooseTypes.ObjectId("0".repeat(24));

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
    const videos = await Video.aggregate()
      .match({
        _id: { $gt: body.cursor || CURSOR_START }
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
      .limit(body.limit || DEFAULT_CURSOR_LIMIT);

    res.status(StatusCode.OK).json(videos as GetUserListingRecommendedResponse);
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
    const videos = await Video.aggregate()
      .match({ _id: { $gt: body.cursor || CURSOR_START } })
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
      .limit(body.limit || DEFAULT_CURSOR_LIMIT);

    res.status(StatusCode.OK).json(videos as GetListingPopularVideosResponse);
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
    const videos = await Video.aggregate()
      .match({ _id: { $gt: body.cursor || CURSOR_START } })
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
      .limit(body.limit || DEFAULT_CURSOR_LIMIT);

    res.status(StatusCode.OK).json(videos as GetListingNewVideosResponse);
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
    const videos = await Video.aggregate()
      .match({ _id: { $gt: body.cursor || CURSOR_START } })
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
      .limit(body.limit || DEFAULT_CURSOR_LIMIT);

    res
      .status(StatusCode.OK)
      .json(videos as GetUserListingSubscriptionsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
