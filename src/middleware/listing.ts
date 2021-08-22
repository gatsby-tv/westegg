import { BadRequest, CursorRequest, ErrorMessage } from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export const validateCursorRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body as CursorRequest;

  if (body.cursor && !Types.ObjectId.isValid(body.cursor)) {
    throw new BadRequest(ErrorMessage.INVALID_OBJECT_ID);
  }

  next();
};
