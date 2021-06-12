import { SignInKeyID } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { SignInKeyRef } from "./refs";

/**
 * Temporary store to denote that a magic link was sent to an email
 * The magic link (key with the _id of this type) can be used to create or sign in to an account with the associated email
 */
export type ISignInKey = {
  _id: SignInKeyID;
  key: string;
  email: string;
};

const SignInKeySchemaFields: Record<keyof Omit<ISignInKey, "_id">, any> = {
  // Required
  key: String,
  email: String
};

const SignInKeySchema = new Schema({
  ...SignInKeySchemaFields,
  createdAt: { type: Date, expires: "5m", default: Date.now }
});

const SignInKey = mongoose.model<ISignInKey & Document>(
  SignInKeyRef,
  SignInKeySchema
);
export { SignInKey };
