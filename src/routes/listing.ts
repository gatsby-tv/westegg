import {
  Browsable,
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosResponse,
  GetListingPopularVideosResponse,
  GetUserListingRecommendedResponse,
  GetUserListingSubscriptionsResponse,
  IChannelAccount,
  StatusCode
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video } from "@src/entities/Video";
import { projection } from "@src/utilities";
import { Router } from "express";
import { keys as keysOf } from "ts-transformer-keys";

const router = Router();

/**
 * GET /listing/featured/channels
 */
router.get("/featured/channels", async (req, res, next) => {
  try {
    // TODO: Should get actual list of featured channels, for now just get first 10
    const channels = await Channel.find(
      {},
      projection(keysOf<Omit<IChannelAccount, "_id">>())
    ).limit(10);

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
    let videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()));

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
    let videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()));

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
    let videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()));

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
    let videos = await Video.aggregate()
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
      .project(projection(keysOf<Browsable>()));

    res
      .status(StatusCode.OK)
      .json(videos as GetUserListingSubscriptionsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
