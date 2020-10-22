import { Request, Response } from "express";
import { CreateChannelRequest } from "../types";
import { validateChannelHandle } from "./handled";
import { validateDisplayName } from "./named";

export const validateCreateChannel = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    const request: CreateChannelRequest = req.body;

    // Validate handle
    await validateChannelHandle(request.handle);

    // Validate display name
    validateDisplayName(request.displayName);
  } catch (error) {
    // Send bad request if failed to validate
    return res.status(400).json({ error: error.message });
  }

  next();
};
