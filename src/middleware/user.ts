import {
  ErrorMessage,
  NotFound,
  PutUserRequest,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { hasPermission, ResourceAction } from "@src/middleware/auth";
import { validateHandle } from "@src/middleware/handled";

import { User } from "@src/entities/User";

/**
 * PUT /user/:id/*
 */
export const hasPermissionToPutUserRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get the user performing the action
  const actor = await User.findById(req.decodedToken!._id);

  // Get the user to update
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFound(ErrorMessage.USER_NOT_FOUND);
  }

  // Check if the actor (user performing the request) has permission to update the user
  if (!hasPermission(actor!, user, ResourceAction.PUT)) {
    throw new Unauthorized(ErrorMessage.USER_FORBIDDEN_TO_PERFORM_ACTION);
  }

  next();
};

export const validatePutUserRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const request = req.body as PutUserRequest;

  if (request.handle) {
    // Validate handle
    validateHandle(request.handle);
  }
  next();
};
