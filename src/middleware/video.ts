import {
  BadRequest,
  ErrorMessage,
  NotFound,
  PostVideoRequest,
  PutVideoRequest,
  PutVideoRequestParams,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";

import { Channel } from "@src/entities/Channel";
import { Video } from "@src/entities/Video";

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 2048;

export const validatePostVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const request: PostVideoRequest = req.body;

  // Get the channel we want to modify
  const channel = await Channel.findById(request.channel);

  // Check the channel to upload the video to exists
  if (!channel) {
    throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
  }

  // Check if the user making the request is an owner
  // TODO: Better permission checking here
  if (
    !channel.owners.map((id) => id.toString()).includes(req.decodedToken!._id)
  ) {
    throw new Unauthorized(ErrorMessage.USER_FORBIDDEN_TO_PERFORM_ACTION);
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
};

export const validatePutVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const request = req.body as PutVideoRequest;
  const params = req.params as PutVideoRequestParams;

  // Get the video we want to modify
  const video = await Video.findById(params.id);

  // Check that the video exists
  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  const channel = await Channel.findById(video.channel);

  // Make sure channel exists
  if (!channel) {
    throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
  }

  // Check if the user making the request is an owner
  // TODO: Better permission checking here
  if (
    !channel.owners.map((id) => id.toString()).includes(req.decodedToken!._id)
  ) {
    throw new Unauthorized(ErrorMessage.USER_FORBIDDEN_TO_PERFORM_ACTION);
  }

  // TODO: Validate ipfs video/thumbnail hash are correct format

  if (request.title) {
    if (
      request.title.length < TITLE_MIN_LENGTH ||
      request.title.length > TITLE_MAX_LENGTH
    ) {
      throw new BadRequest(ErrorMessage.VIDEO_TITLE_OUT_OF_RANGE);
    }

    if (request.title.length > DESCRIPTION_MAX_LENGTH) {
      throw new BadRequest(ErrorMessage.VIDEO_DESCRIPTION_OUT_OF_RANGE);
    }
  }

  next();
};

export const validateVideoExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const params = req.params as PutVideoRequestParams;

  // Get the video we want to modify
  const video = await Video.findById(params.id);

  // Check that the video exists
  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }

  next();
};
