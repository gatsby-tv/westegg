import { Request, Response } from "express";
import { UploadVideoRequest } from "../types";

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 256;
const DESCRIPTION_MAX_LENGTH = 2048;

// TODO: Validate video and thumbnail ipfs hash

export const validateVideoUpload = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    const request: UploadVideoRequest = req.body;

    if (
      request.title.length < TITLE_MIN_LENGTH ||
      request.title.length > TITLE_MAX_LENGTH
    ) {
      throw new Error(
        `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters!`
      );
    }

    if (request.title.length > DESCRIPTION_MAX_LENGTH) {
      throw new Error(
        `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters!`
      );
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
