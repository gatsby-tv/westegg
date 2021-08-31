import { IBasicVideo } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { ChannelRef, UserRef, VideoRef } from "@src/entities/refs";

const VideoSchemaFields: Record<keyof Omit<IBasicVideo, "_id">, any> = {
  // Required
  title: String,
  releaseDate: Date,
  duration: Number,
  content: String,
  channel: { type: Schema.Types.ObjectId, ref: ChannelRef },
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
  contributors: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  sponsors: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  promotions: {},
  contributions: { type: Schema.Types.Mixed, default: {} },
  next: {},
  previous: {}
};

const VideoSchema = new Schema(VideoSchemaFields);

const Video = mongoose.model<IBasicVideo & Document>(VideoRef, VideoSchema);
export { Video };
