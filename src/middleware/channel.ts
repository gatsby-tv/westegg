import {
  ErrorMessage,
  NotFound,
  PostChannelRequest,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";
import { hasPermission, ResourceAction } from "./auth";
import { validateChannelHandle } from "./handled";
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
    await validateChannelHandle(request.handle);

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
    // Get the user performing the action
    const actor = await User.findById(req.decodedToken!._id);

    // Get the channel to update
    const user = await Channel.findById(req.params.id);
    if (!user) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    // Check if the actor (user performing the request) has permission to update the channel
    if (!hasPermission(actor!, user, ResourceAction.PUT)) {
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
  } catch (error) {
    next(error);
  }
};
