import { ErrorResponse, PostChannelRequest } from "@gatsby-tv/types";
import { Request, Response } from "express";
import { validateChannelHandle } from "./handled";
import { validateName } from "./named";

export const validatePostChannel = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    const request: PostChannelRequest = req.body;

    // Validate handle
    await validateChannelHandle(request.handle);

    // Validate display name
    validateName(request.name);
  } catch (error) {
    // Send bad request if failed to validate
    return res.status(400).json({ error } as ErrorResponse);
  }

  next();
};
