import mongoose, { Document, Schema } from "mongoose";
import { PersistSessionRef } from "./refs";

/**
 * Temporary store to denote that a magic link was sent to an email
 * The magic link (key with the _id of this type) can be used to create or sign in to an account with the associated email
 *
 * A PersistSession is built from extending a Session of the same id/email, but TTL is 1 hour.
 */
export type IPersistSession = {
  _id: string;
  email: string;
};

const PersistSessionSchemaFields = {
  // Required
  _id: Schema.Types.ObjectId,
  email: String
};

const PersistSessionSchema = new Schema({
  ...PersistSessionSchemaFields,
  createdAt: { type: Date, expires: "1h", default: Date.now }
});

const PersistSession = mongoose.model<IPersistSession & Document>(
  PersistSessionRef,
  PersistSessionSchema
);
export { PersistSession };
