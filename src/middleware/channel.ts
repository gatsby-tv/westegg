import { PostChannelRequest } from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { validateChannelHandle } from "./handled";
import { validateName } from "./named";

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
  } catch (error) {
    next(error);
  }

  next();
};
