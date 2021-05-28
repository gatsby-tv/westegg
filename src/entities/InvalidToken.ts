import { UserID } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { InvalidTokenRef } from "./refs";

/**
 * Invalid tokens are simple documents that contain the expiration date for any tokens created per user.
 * Meaning a token (read JWT) that has an `issuedAt` property BEFORE the cutoff (expire) date, then this token is invalid no matter what.
 */

export type IInvalidToken = {
  _id: UserID;
  expire: Date;
};

const InvalidTokenSchemaFields: Record<keyof IInvalidToken, any> = {
  // Required
  _id: Schema.Types.ObjectId,
  expire: Date
};

const InvalidTokenSchema = new Schema(InvalidTokenSchemaFields);

const InvalidToken = mongoose.model<IInvalidToken & Document>(
  InvalidTokenRef,
  InvalidTokenSchema
);
export { InvalidToken };
