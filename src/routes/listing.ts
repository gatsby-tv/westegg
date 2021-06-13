import {
  BasicVideo,
  Browsable,
  EpisodicVideo,
  ErrorMessage,
  GetListingFeaturedChannelsResponse,
  GetListingNewVideosResponse,
  GetListingPopularVideosResponse,
  GetUserListingRecommendedResponse,
  GetUserListingSubscriptionsResponse,
  IBasicVideo,
  IChannelAccount,
  NotFound,
  SerialVideo,
  Show,
  StatusCode,
  Video as ClientVideo
} from "@gatsby-tv/types";
import { Router } from "express";
import { keys as keysOf } from "ts-transformer-keys";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";
import { projection } from "../utilities";

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

// Convert IBasicVideo to BasicVideo
// TODO: Move to better file
async function toBasicVideo(input: IBasicVideo): Promise<BasicVideo> {
  let channel = await Channel.findById(input.channel);
  if (!channel) {
    throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
  }
  let output = {
    // TODO: Object spread includes unnecessary keys here, we should strip out properties before returning
    ...input,
    channel: channel,
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
// TODO: Add to /user/:id route
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
    res.status(StatusCode.OK).json(content as GetListingNewVideosResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /listing/subscriptions
 */
// TODO: Add to /user/:id route
router.get("/subscriptions", async (req, res, next) => {
  try {
    // TODO: Page content to limit (currently hardcoded to 25)
    const basicVideos: BasicVideo[] = await Promise.all(
      (await Video.find().limit(25)).map(
        async (entity) => await toBasicVideo(entity as IBasicVideo)
      )
    );
    // TODO: Include serial and episodic videos
    const serialVideos: SerialVideo[] = [];
    const episodicVideos: EpisodicVideo[] = [];

    const content: ClientVideo[] = [
      ...basicVideos,
      ...serialVideos,
      ...episodicVideos
    ];
    res
      .status(StatusCode.OK)
      .json(content as GetUserListingSubscriptionsResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
