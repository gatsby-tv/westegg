import { SignInKeyID } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { SigninKeyRef } from "./refs";

/**
 * Temporary store to denote that a magic link was sent to an email
 * The magic link (key with the _id of this type) can be used to create or sign in to an account with the associated email
 */
export type ISigninKey = {
  _id: SignInKeyID;
  email: string;
};

const SigninKeySchemaFields: Record<keyof Omit<ISigninKey, "_id">, any> = {
  // Required
  email: String
};

const SigninKeySchema = new Schema({
  ...SigninKeySchemaFields,
  createdAt: { type: Date, expires: "5m", default: Date.now }
});

const SigninKey = mongoose.model<ISigninKey & Document>(
  SigninKeyRef,
  SigninKeySchema
);
export { SigninKey };
