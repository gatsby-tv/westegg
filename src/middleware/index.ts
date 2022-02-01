import { BadRequest, ErrorMessage } from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";

export const isValidBody = async (
  keys: string[],
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body;

  if (!body) {
    throw new BadRequest(ErrorMessage.BAD_REQUEST);
  }
  Object.keys(body).forEach((key) => {
    if (!keys.includes(key)) {
      throw new BadRequest(ErrorMessage.BAD_REQUEST);
    }
  });

  next();
};

export const escapeQueryRegExp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const query = req.query.query as string;
  req.searchQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

  next();
};
