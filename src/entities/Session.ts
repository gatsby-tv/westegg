import mongoose, { Document, Schema } from "mongoose";
import { SessionRef } from "./refs";

/**
 * Temporary store to denote that a magic link was sent to an email
 * The magic link (key with the _id of this type) can be used to create or sign in to an account
 */
export type ISession = {
  _id: string;
  email: string;
};

const SessionSchemaFields: Record<keyof Omit<ISession, "_id">, any> = {
  // Required
  email: String
};

const SessionSchema = new Schema({
  ...SessionSchemaFields,
  createdAt: { type: Date, expires: "5m", default: Date.now }
});

const Session = mongoose.model<ISession & Document>(SessionRef, SessionSchema);
export { Session };
