import mongoose, { Document, Schema } from "mongoose";
import { PersistSignInKeyRef } from "@src/entities/refs";
import { ISignInKey } from "@src/entities/SignInKey";

/**
 * Temporary store to denote that a magic link was sent to an email
 * The magic link (key with the _id of this type) can be used to create or sign in to an account with the associated email
 *
 * A PersistSignInKey is built from extending a SignInKey of the same id/email, but TTL is 1 hour.
 */

const PersistSignInKeySchemaFields: Record<keyof ISignInKey, any> = {
  // Required
  _id: Schema.Types.ObjectId,
  key: String,
  email: String
};

const PersistSignInKeySchema = new Schema({
  ...PersistSignInKeySchemaFields,
  createdAt: { type: Date, expires: "1h", default: Date.now }
});

const PersistSignInKey = mongoose.model<ISignInKey & Document>(
  PersistSignInKeyRef,
  PersistSignInKeySchema
);
export { PersistSignInKey };
