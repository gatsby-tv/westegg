import mongoose, { Schema, Document } from "mongoose";
import { IBasicVideo } from "@gatsby-tv/types";
import { ChannelRef, UserRef, VideoRef } from "./refs";

const VideoSchemaFields: Record<keyof Omit<IBasicVideo, "_id">, any> = {
  // Required
  title: String,
  releaseDate: Date,
  duration: Number,
  content: String,
  channel: { type: Schema.Types.ObjectId, ref: ChannelRef },
  // TODO: Default thumbnail?
  thumbnail: {
    type: {
      hash: String,
      mimeType: String
    }
  },
  // Optional
  description: { type: String, default: "" },
  views: { type: Number, default: 0 },
  unlisted: { type: Boolean, default: false },
  collaborators: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  tags: { type: [String], default: [] },
  explicit: { type: Boolean, default: false },
  // TODO: Should topic/genre be required?
  topic: { type: String, default: "" },
  genre: { type: String, default: "" },
  contributors: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  sponsors: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  sponsored: { type: Boolean, default: false },
  // TODO:
  contributions: { type: Schema.Types.Mixed, default: {} }
};

const VideoSchema = new Schema(VideoSchemaFields);

const Video = mongoose.model<IBasicVideo & Document>(VideoRef, VideoSchema);
export { Video };
