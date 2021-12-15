import {
  GetVideoSearchRequestQuery,
  GetVideoSearchResponse,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { Video as VideoCollection } from "@src/entities/Video";
import { validateCursorRequest } from "@src/middleware/listing";
import { projection } from "@src/util";
import { Router, Request, Response, NextFunction } from "express";
import * as Express from "express-serve-static-core";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";
import { CURSOR_START, preAlphaFillListing } from "@src/util/cursor";
import { GetListingVideosWithTagsRequestQuery } from "@gatsby-tv/types";

const router = Router();

/**
 * GET /search
 */
interface GetVideoSearchRequestQueryParams
  extends Record<keyof GetVideoSearchRequestQuery, string>,
    Express.Query {}
router.get(
  "/",
  validateCursorRequest,
  async (
    req: Request<{}, {}, {}, GetVideoSearchRequestQueryParams>,
    res: Response,
    next: NextFunction
  ) => {
    const videos = (await VideoCollection.aggregate()
      .match({
        title: { $regex: RegExp(req.query.query as string) } // TODO: Needs to be sanitized
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
      .project(projection(keysOf<Video>()))
      .limit(req.limit)) as Video[];

    const response = {
      content: videos,
      cursor: CURSOR_START, // TODO: implement cursor
      limit: req.limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

export default router;
