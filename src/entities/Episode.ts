import mongoose, { Schema, Document } from "mongoose";
import { EpisodeRef, UploadableRef } from "./refs";
import { IVideo } from "./Video";

// Interface
interface IEpisode extends IVideo {
  index: number;
}

// DB Implementation
const EpisodeSchemaFields: Record<keyof IEpisode, any> = {
  title: String,
  description: String,
  views: Number,
  dateUploaded: Date,
  hash: String,
  thumbnailHash: String,
  uploadable: [{ type: Schema.Types.ObjectId, ref: UploadableRef }],
  index: Number
};

const EpisodeSchema = new Schema(EpisodeSchemaFields);

const Episode = mongoose.model<IEpisode & Document>(EpisodeRef, EpisodeSchema);
export { IEpisode, Episode };
