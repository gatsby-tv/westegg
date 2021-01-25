import { IChannel } from "@gatsby-tv/types";
import mongoose, { Schema, Document } from "mongoose";
import { DEFAULT_AVATAR } from "./Base";
import { ChannelRef, UserRef, VideoRef } from "./refs";

const ChannelSchemaFields: Record<keyof IChannel, any> = {
  // Required
  _id: String,
  handle: String,
  name: String,
  owners: { type: [String], ref: UserRef },
  creationDate: Date,
  // Optional
  subscribers: { type: [String], ref: UserRef, default: [] },
  avatar: {
    type: {
      hash: String,
      mimeType: String
    },
    default: DEFAULT_AVATAR
  },
  verified: { type: Boolean, default: false },
  description: { type: String, default: "" },
  collaborators: { type: [String], ref: UserRef, default: [] },
  contributors: { type: [String], ref: UserRef, default: [] },
  admins: { type: [String], ref: UserRef, default: [] },
  moderators: { type: [String], ref: UserRef, default: [] },
  trusted: { type: Boolean, default: false },
  videos: { type: [Schema.Types.ObjectId], ref: VideoRef, default: [] },
  playlists: {}, // TODO: { type: [Schema.Types.ObjectId], ref: PlaylistRef, default: [] },
  shows: {}, // TODO: { types: [Schema.Types.ObjectId], ref: ShowRef, default: [] },
  // TODO:
  management: {},
  settings: {},
  invitations: {},
  contributions: {}
};

const ChannelSchema = new Schema(ChannelSchemaFields);
export const Channel = mongoose.model<IChannel & Document>(
  ChannelRef,
  ChannelSchema
);
