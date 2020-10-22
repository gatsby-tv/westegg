import mongoose, { Schema, Document } from "mongoose";
import { IHandled, INamed } from "../types";
import { ChannelRef, UserRef } from "./refs";

// Interface
interface IUser extends IHandled, INamed {
  email: string;
  // Password optional to keep out of responses to client
  password: string;
  channels: Array<Schema.Types.ObjectId>;
}

// DB Implementation
const UserSchemaFields: Record<keyof IUser, any> = {
  handle: String,
  displayName: String,
  email: String,
  password: String,
  channels: [{ type: Schema.Types.ObjectId, ref: ChannelRef }]
};

const UserSchema = new Schema(UserSchemaFields);

const User = mongoose.model<IUser & Document>(UserRef, UserSchema);
export { IUser, User };
