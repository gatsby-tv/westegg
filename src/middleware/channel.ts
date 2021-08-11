import {
  ErrorMessage,
  NotFound,
  PostChannelRequest,
  PutChannelHandleRequest,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";

import { Channel } from "@src/entities/Channel";
import { User } from "@src/entities/User";

import { hasPermission, ResourceAction } from "./auth";
import { validateHandle } from "./handled";
import { validateName } from "./named";

/**
 * POST /channel
 */
export const validatePostChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request: PostChannelRequest = req.body;

    // Validate handle
    validateHandle(request.handle);

    // Validate display name
    validateName(request.name);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /channel/:id/*
 */
export const hasPermissionToPutChannelRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: params as generic put request for channel
    // Get the user performing the action
    const actor = await User.findById(req.decodedToken!._id);

    // Get the channel to update
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    // Check if the actor (user performing the request) has permission to update the channel
    if (!hasPermission(actor!, channel, ResourceAction.PUT)) {
      throw new Unauthorized(ErrorMessage.USER_FORBIDDEN_TO_PERFORM_ACTION);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /channel/:id/handle
 */
export const validatePutChannelHandleRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = req.body as PutChannelHandleRequest;

    // Validate handle
    validateHandle(request.handle);
    next();
  } catch (error) {
    next(error);
  }
};
