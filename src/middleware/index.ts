import { BadRequest, ErrorMessage } from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";

export const isValidBody = async (
  keys: string[],
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
