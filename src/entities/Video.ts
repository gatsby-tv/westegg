import { IBasicVideo } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { ChannelRef, UserRef, VideoRef } from "./refs";

const VideoSchemaFields: Record<keyof Omit<IBasicVideo, "_id">, any> = {
  // Required
  title: String,
  releaseDate: Date,
  duration: Number,
  content: String,
  channel: { type: String, ref: ChannelRef },
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
  collaborators: { type: [String], ref: UserRef, default: [] },
  tags: { type: [String], default: [] },
  explicit: { type: Boolean, default: false },
  contributors: { type: [String], ref: UserRef, default: [] },
  sponsors: { type: [String], ref: UserRef, default: [] },
  // TODO:
  promotions: {},
  contributions: { type: Schema.Types.Mixed, default: {} },
  next: {},
  previous: {}
};

const VideoSchema = new Schema(VideoSchemaFields);

const Video = mongoose.model<IBasicVideo & Document>(VideoRef, VideoSchema);
export { Video };
