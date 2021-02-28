import {
  Browsable,
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosResponse,
  GetListingPopularVideosResponse,
  GetListingTopicsResponse,
  GetUserListingRecommendedResponse,
  GetUserListingSubscriptionsResponse,
  IChannelAccount,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import { Channel } from "../entities/Channel";

const router = Router();

/**
 * GET /listing/featured/channels
 */
router.get("/featured/channels", async (req, res, next) => {
  try {
    // TODO: Should get actual list of featured channels, for now just get first 10
    const channels = (await Channel.find().limit(10)).map(
      (entity) => entity as IChannelAccount
    );
    res
      .status(StatusCode.OK)
      .json({ channels } as GetListingFeaturedChannelsResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/videos/recommended
 */
router.get("/videos/recommended", async (req, res, next) => {
  try {
    // TODO: Issue here converting IVideo entity to Browsable
    // const content = (await Video.find().limit(25).map(entity => entity as Browsable));
    const content: Browsable[] = [];
    res
      .status(StatusCode.OK)
      .json({ content } as GetUserListingRecommendedResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/videos/popular
 */
router.get("/videos/popular", async (req, res, next) => {
  try {
    // TODO: Issue here converting IVideo entity to Browsable
    // const content = (await Video.find().limit(25).map(entity => entity as Browsable));
    const content: Browsable[] = [];
    res
      .status(StatusCode.OK)
      .json({ content } as GetListingPopularVideosResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/videos/new
 */
router.get("/videos/new", async (req, res, next) => {
  try {
    // TODO: Issue here converting IVideo entity to Browsable
    // const content = (await Video.find().limit(25).map(entity => entity as Browsable));
    const content: Browsable[] = [];
    res.status(StatusCode.OK).json({ content } as GetListingNewVideosResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/subscriptions
 */
router.get("/subscriptions", async (req, res, next) => {
  try {
    // TODO: Issue here converting IVideo entity to Browsable
    // const content = (await Video.find().limit(25).map(entity => entity as Browsable));
    const content: Browsable[] = [];
    res
      .status(StatusCode.OK)
      .json({ content } as GetUserListingSubscriptionsResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/topics
 */
router.get("/topics", async (req, res, next) => {
  try {
    // TODO: Issue here converting IVideo entity to Browsable
    // const content = (await Video.find().limit(25).map(entity => entity as Browsable));
    const content: Browsable[] = [];
    res.status(StatusCode.OK).json({
      topics: [{ topic: "Empty", content }]
    } as GetListingTopicsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;