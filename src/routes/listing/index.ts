import {
  GetListingFeaturedChannelsResponse,
  IChannelAccount,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video as VideoCollection } from "@src/entities/Video";
import { validateCursorRequest } from "@src/middleware/listing";
import { projection } from "@src/util";
import { Router } from "express";
import { keys as keysOf } from "ts-transformer-keys";
import { preAlphaFillListing } from "@src/util/cursor";

const router = Router();

/**
 * GET /listing/featured/channels
 */
router.get(
  "/featured/channels",
  validateCursorRequest,
  async (req, res, next) => {
    let channels = await Channel.find(
      {},
      projection(keysOf<Omit<IChannelAccount, "_id">>())
    ).limit(req.limit);
    const listing = preAlphaFillListing<IChannelAccount>(channels, req.limit);
    res
      .status(StatusCode.OK)
      .json(listing.content as GetListingFeaturedChannelsResponse);
  }
);

/**
 * GET /listing/videos/popular
 */
router.get("/videos/popular", validateCursorRequest, async (req, res, next) => {
  let videos = (await VideoCollection.aggregate()
    .match({ _id: { $gt: req.cursor } })
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
    .limit(req.limit)) as Video[];

  const listing = preAlphaFillListing<Video>(videos, req.limit);

  const response = {
    content: listing.content,
    cursor: listing.next,
    limit: req.limit
  };

  res.status(StatusCode.OK).json(response);
});

/**
 * GET /listing/videos/new
 */
router.get("/videos/new", validateCursorRequest, async (req, res, next) => {
  let videos = (await VideoCollection.aggregate()
    .match({ _id: { $gt: req.cursor } })
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
    .limit(req.limit)) as Video[];

  const listing = preAlphaFillListing<Video>(videos, req.limit);

  const response = {
    content: listing.content,
    cursor: listing.next,
    limit: req.limit
  };

  res.status(StatusCode.OK).json(response);
});

export default router;
