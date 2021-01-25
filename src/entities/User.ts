import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "@gatsby-tv/types";
import { ChannelRef, UserRef, VideoRef } from "./refs";
import { DEFAULT_AVATAR } from "./Base";

// TODO: Record fields of interface without using any keyword (automatic mapping?)
// TODO: Include required key

const UserSchemaFields: Record<keyof IUser, any> = {
  // Required
  _id: String,
  handle: String,
  name: String,
  creationDate: Date,
  // Optional
  avatar: {
    type: {
      hash: String,
      mimeType: String
    },
    default: DEFAULT_AVATAR
  },
  verified: { type: Boolean, default: false },
  description: { type: String, default: "" },
  followers: { type: Number, default: 0 },
  channels: { type: [String], ref: ChannelRef, default: [] },
  collaborations: {
    type: [String],
    ref: ChannelRef,
    default: []
  },
  email: String,
  administering: {
    type: [String],
    ref: ChannelRef,
    default: []
  },
  moderating: { type: [String], ref: ChannelRef, default: [] },
  invitations: {
    owners: { type: [String], ref: UserRef, default: [] },
    collaborators: { type: [String], ref: UserRef, default: [] },
    admin: { type: [String], ref: UserRef, default: [] },
    moderator: { type: [String], ref: UserRef, default: [] }
  },
  following: { type: [String], ref: UserRef, default: [] },
  subscriptions: {
    type: [String],
    ref: ChannelRef,
    default: []
  },
  history: { type: [Schema.Types.ObjectId], ref: VideoRef, default: [] },
  // TODO:
  settings: {},
  bookmarks: {}
};

const UserSchema = new Schema(UserSchemaFields);
export const User = mongoose.model<IUser & Document>(UserRef, UserSchema);
