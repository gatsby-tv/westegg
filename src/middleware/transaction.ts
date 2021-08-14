import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const startTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await mongoose.startSession();

    req.session = session;
  } catch (err) {
    next(err);
  }
};

export const commitTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Committing transaction");
    if (!req.session) {
      throw new Error("No session found");
    }
    req.session.endSession();
  } catch (err) {
    next(err);
  }
};
