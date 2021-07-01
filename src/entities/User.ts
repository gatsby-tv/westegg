import { IUser } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { DEFAULT_AVATAR } from "./Base";
import { ChannelRef, UserRef, VideoRef } from "./refs";

const UserSchemaFields: Record<keyof Omit<IUser, "_id">, any> = {
  // Required
  handle: { type: String, unique: true },
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
  channels: { type: [Schema.Types.ObjectId], ref: ChannelRef, default: [] },
  collaborations: {
    type: [Schema.Types.ObjectId],
    ref: ChannelRef,
    default: []
  },
  email: { type: String, unique: true },
  administering: {
    type: [Schema.Types.ObjectId],
    ref: ChannelRef,
    default: []
  },
  moderating: { type: [Schema.Types.ObjectId], ref: ChannelRef, default: [] },
  invitations: {
    owners: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
    collaborators: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
    admin: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
    moderator: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] }
  },
  following: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  subscriptions: {
    type: [Schema.Types.ObjectId],
    ref: ChannelRef,
    default: []
  },
  history: { type: [Schema.Types.ObjectId], ref: VideoRef, default: [] },
  banned: { type: Boolean, default: false },
  trusted: { type: Boolean, default: false },
  // TODO:
  banner: {},
  promotions: {},
  settings: {},
  bookmarks: {}
};

const UserSchema = new Schema(UserSchemaFields);
export const User = mongoose.model<IUser & Document>(UserRef, UserSchema);
