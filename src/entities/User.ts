import mongoose, { Schema, Document } from "mongoose";
import { IHandled, INamed } from "../types";

// Interface
interface IUser extends IHandled, INamed {
  email: string;
  // Password optional to keep out of responses to client
  password?: string;
}

// DB Implementation
const UserSchemaFields: Record<keyof IUser, any> = {
  handle: String,
  displayName: String,
  email: String,
  password: String
};

const UserSchema = new Schema(UserSchemaFields);

const User = mongoose.model<IUser & Document>("User", UserSchema);
export { IUser, User };
