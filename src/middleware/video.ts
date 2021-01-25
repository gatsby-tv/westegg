import {
  BadRequest,
  ErrorMessage,
  Forbidden,
  NotFound,
  PostVideoRequest
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 2048;

export const validatePostVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request: PostVideoRequest = req.body;

    // Get the channel we want to modify
    const channel = await Channel.findById(request.channel);

    // Check the channel to upload the video to exists
    // TODO: We're making two calls for the same thing in validate methods, how do we get around this?
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    // Check if the user making the request is an owner
    // TODO: Better permission checking here
    if (
      !channel.owners
        .map((id) => id.toString())
        .includes(req.decodedUserToken._id)
    ) {
      throw new Forbidden(ErrorMessage.USER_FORBIDDEN_TO_PERFORM_ACTION);
    }

    // TODO: Validate ipfs video/thumbnail hash are correct format

    // Check that the video hash doesn't already exist
    // TODO: Handle content with multiple hashes
    const video = await Video.findOne({ content: request.content });
    if (video) {
      throw new BadRequest(ErrorMessage.VIDEO_ALREADY_EXISTS);
    }

    if (
      request.title.length < TITLE_MIN_LENGTH ||
      request.title.length > TITLE_MAX_LENGTH
    ) {
      throw new BadRequest(ErrorMessage.VIDEO_TITLE_OUT_OF_RANGE);
    }

    if (request.title.length > DESCRIPTION_MAX_LENGTH) {
      throw new BadRequest(ErrorMessage.VIDEO_DESCRIPTION_OUT_OF_RANGE);
    }

    next();
  } catch (error) {
    next(error);
  }
};
