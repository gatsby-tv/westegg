import {
  ErrorMessage,
  NotFound,
  PutUserHandleRequest,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import { hasPermission, ResourceAction } from "./auth";
import { validateHandle } from "./handled";

/**
 * PUT /user/:id/*
 */
export const hasPermissionToPutUserRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const validatePutUserHandleRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = req.body as PutUserHandleRequest;

    // Validate handle
    validateHandle(request.handle);
    next();
  } catch (error) {
    next(error);
  }
};
