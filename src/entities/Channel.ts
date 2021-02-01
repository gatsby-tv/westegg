import { IChannel } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { DEFAULT_AVATAR } from "./Base";
import { ChannelRef, UserRef, VideoRef } from "./refs";

const ChannelSchemaFields: Record<keyof Omit<IChannel, "_id">, any> = {
  // Required
  handle: String,
  name: String,
  owners: { type: [Schema.Types.ObjectId], ref: UserRef },
  creationDate: Date,
  // Optional
  subscribers: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  avatar: {
    type: {
      hash: String,
      mimeType: String
    },
    default: DEFAULT_AVATAR
  },
  verified: { type: Boolean, default: false },
  description: { type: String, default: "" },
  collaborators: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  contributors: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  publicAdmins: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  publicModerators: {
    type: [Schema.Types.ObjectId],
    ref: UserRef,
    default: []
  },
  trusted: { type: Boolean, default: false },
  videos: { type: [Schema.Types.ObjectId], ref: VideoRef, default: [] },
  banned: { type: Boolean, default: false },
  playlists: {}, // TODO: { type: [Schema.Types.ObjectId], ref: PlaylistRef, default: [] },
  shows: {}, // TODO: { types: [Schema.Types.ObjectId], ref: ShowRef, default: [] },
  // TODO:
  poster: {},
  banner: {},
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
