import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const useTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();

  req.session = session;
  session.startTransaction();
  next();
  await session.commitTransaction();
  session.endSession();
};
