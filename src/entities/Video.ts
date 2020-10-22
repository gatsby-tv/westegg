import mongoose, { Schema, Document } from "mongoose";
import { VideoRef } from "./refs";

// Interface
interface IVideo {
  title: string;
  description: string;
  views: number;
  dateUploaded: Date;
  hash: string;
  thumbnailHash: string;
}

// DB Implementation
const VideoSchemaFields: Record<keyof IVideo, any> = {
  title: String,
  description: String,
  views: Number,
  dateUploaded: Date,
  hash: String,
  thumbnailHash: String
};

const VideoSchema = new Schema(VideoSchemaFields);

const Video = mongoose.model<IVideo & Document>(VideoRef, VideoSchema);
export { IVideo, Video };
