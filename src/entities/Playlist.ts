import { IPlaylist } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { ChannelRef, PlaylistRef, UserRef, VideoRef } from "./refs";

const PlaylistSchemaFields: Record<keyof Omit<IPlaylist, "_id">, any> = {
  // Required
  title: String,
  creationDate: Date,
  thumbnail: {
    type: {
      hash: String,
      mimeType: String
    }
  },
  channel: { type: Schema.Types.ObjectId, ref: ChannelRef },
  videos: { type: [Schema.Types.ObjectId], ref: VideoRef },
  // Optional
  description: { type: String, default: "" },
  views: { type: Number, default: 0 },
  collaborators: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  tags: { type: [String], default: [] },
  explicit: { type: Boolean, default: false },
  unlisted: { type: Boolean, default: false }
};

const PlaylistSchema = new Schema(PlaylistSchemaFields);

const Playlist = mongoose.model<IPlaylist & Document>(
  PlaylistRef,
  PlaylistSchema
);
export { Playlist };
