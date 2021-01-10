import {
  ErrorCode,
  ErrorResponse,
  PostVideoRequest,
  WestEggError
} from "@gatsby-tv/types";
import { Request, Response } from "express";
import { Channel } from "../entities/Channel";
import { Video } from "../entities/Video";

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 2048;

export const validatePostVideo = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    const request: PostVideoRequest = req.body;

    // Get the channel we want to modify
    const channel = await Channel.findById(request.channel);

    // Check the channel to upload the video to exists
    // TODO: We're making two calls for the same thing in validate methods, how do we get around this?
    if (!channel) {
      throw new WestEggError(ErrorCode.NOT_FOUND, "Channel not found!");
    }

    // Check if the user making the request is an owner
    // TODO: Better permission checking here
    if (
      !channel.owners
        .map((id) => id.toString())
        .includes(req.decodedUserToken._id)
    ) {
      throw new WestEggError(
        ErrorCode.UNAUTHORIZED,
        "User does not have permission to update the requested channel!"
      );
    }

    // TODO: Validate ipfs video/thumbnail hash are correct format

    // Check that the video hash doesn't already exist
    const video = await Video.findOne({ content: request.content });
    if (video) {
      throw new WestEggError(ErrorCode.BAD_REQUEST, "Video already exists!");
    }

    if (
      request.title.length < TITLE_MIN_LENGTH ||
      request.title.length > TITLE_MAX_LENGTH
    ) {
      throw new WestEggError(
        ErrorCode.VIDEO_TITLE_OUT_OF_RANGE,
        `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters!`
      );
    }

    if (request.title.length > DESCRIPTION_MAX_LENGTH) {
      throw new WestEggError(
        ErrorCode.VIDEO_DESCRIPTION_OUT_OF_RANGE,
        `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters!`
      );
    }

    next();
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
};
