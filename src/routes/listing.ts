import {
  BasicVideo,
  Browsable,
  Channel as ChannelType,
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosResponse,
  GetListingPopularVideosResponse,
  GetUserListingRecommendedResponse,
  GetUserListingSubscriptionsResponse,
  IBasicVideo,
  SerialVideo,
  Show,
  StatusCode
} from "@gatsby-tv/types";
import { Router } from "express";
import { getCachedChannelById } from "../cache";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";

const router = Router();

/**
 * GET /listing/featured/channels
 */
router.get("/featured/channels", async (req, res, next) => {
  try {
    // TODO: Should get actual list of featured channels, for now just get first 10
    const channels = (await Channel.find().limit(10)).map(
      (entity) => entity as ChannelType
    );
    res
      .status(StatusCode.OK)
      .json(channels as GetListingFeaturedChannelsResponse);
  } catch (error) {
    next(error);
  }
});

// Convert IBasicVideo to BasicVideo
async function toBasicVideo(input: IBasicVideo): Promise<BasicVideo> {
  let output = {
    // TODO: Object spread includes unnecessary keys here, we should strip out properties before returning
    ...input,
    channel: await getCachedChannelById(input.channel),
    // TODO: Get from collections
    collaborators: [],
    contributors: [],
    sponsors: []
  } as BasicVideo;

  return output;
}

/**
 * GET /listing/videos/recommended
 */
router.get("/videos/recommended", async (req, res, next) => {
  try {
    // TODO: Page content to limit (currently hardcoded to 25)
    const basicVideos: BasicVideo[] = await Promise.all(
      (await Video.find().limit(25)).map(
        async (entity) => await toBasicVideo(entity as IBasicVideo)
      )
    );
    // TODO: Include serial videos and shows
    const serialVideos: SerialVideo[] = [];
    const shows: Show[] = [];

    const content: Browsable[] = [...basicVideos, ...serialVideos, ...shows];

    res
      .status(StatusCode.OK)
      .json(content as GetUserListingRecommendedResponse);
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
    res.status(StatusCode.OK).json(content as GetListingPopularVideosResponse);
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
    res.status(StatusCode.OK).json(content as GetListingNewVideosResponse);
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
      .json(content as GetUserListingSubscriptionsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
