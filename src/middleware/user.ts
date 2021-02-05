import { NextFunction, Request, Response } from "express";
import { validateUserHandle } from "./handled";

export const validatePutUserHandleRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: as PutUserHandleRequest
    const request = req.body;
    // Validate handle
    await validateUserHandle(request.handle);
    next();
  } catch (error) {
    next(error);
  }
};
