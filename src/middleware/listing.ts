import { BadRequest, CursorRequest, ErrorMessage } from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import * as Express from "express-serve-static-core";
import { CURSOR_START, DEFAULT_CURSOR_LIMIT } from "@src/util/cursor";

interface CursorRequestQueryParams
  extends Record<keyof CursorRequest, string>,
    Express.Query {}
export const validateCursorRequest = async (
  req: Request<{}, {}, {}, CursorRequestQueryParams>,
  res: Response,
  next: NextFunction
) => {
  const query = req.query;

  if (query.cursor && !Types.ObjectId.isValid(query.cursor)) {
    throw new BadRequest(ErrorMessage.INVALID_OBJECT_ID);
  }

  // Set defaults for cursor/limit params
  const cursor: Types.ObjectId = query.cursor
    ? new Types.ObjectId(query.cursor)
    : CURSOR_START;
  const limit: number = Number(query.limit || DEFAULT_CURSOR_LIMIT);

  req.cursor = cursor;
  req.limit = limit;

  next();
};
