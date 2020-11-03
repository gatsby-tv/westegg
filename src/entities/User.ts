import mongoose, { Schema, Document } from "mongoose";
import { IHandled, INamed } from "../types";
import { UploadableRef, UserRef } from "./refs";

// Interface
interface IUser extends IHandled, INamed {
  email: string;
  // Password optional to keep out of responses to client
  password: string;
  channels: Array<Schema.Types.ObjectId>;
}

// JWT token with mongo entity id and version
interface IUserToken extends IUser {
  _id: Schema.Types.ObjectId;
  __v: number;
  iat: Date;
  exp: Date;
}

// DB Implementation
const UserSchemaFields: Record<keyof IUser, any> = {
  handle: String,
  displayName: String,
  email: String,
  password: String,
  channels: [{ type: Schema.Types.ObjectId, ref: UploadableRef }]
};

const UserSchema = new Schema(UserSchemaFields);

const User = mongoose.model<IUser & Document>(UserRef, UserSchema);
export { IUser, IUserToken, User };
