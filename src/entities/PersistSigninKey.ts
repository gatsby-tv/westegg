import { SignInKeyID } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { PersistSigninKeyRef } from "./refs";

/**
 * Temporary store to denote that a magic link was sent to an email
 * The magic link (key with the _id of this type) can be used to create or sign in to an account with the associated email
 *
 * A PersistSigninKey is built from extending a SigninKey of the same id/email, but TTL is 1 hour.
 */
export type IPersistSigninKey = {
  _id: SignInKeyID;
  email: string;
};

const PersistSigninKeySchemaFields = {
  // Required
  _id: Schema.Types.ObjectId,
  email: String
};

const PersistSigninKeySchema = new Schema({
  ...PersistSigninKeySchemaFields,
  createdAt: { type: Date, expires: "1h", default: Date.now }
});

const PersistSigninKey = mongoose.model<IPersistSigninKey & Document>(
  PersistSigninKeyRef,
  PersistSigninKeySchema
);
export { PersistSigninKey };
