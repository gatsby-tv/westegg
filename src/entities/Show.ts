import { IShow } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { ChannelRef, ShowRef, UserRef } from "./refs";

const ShowSchemaFields: Record<keyof Omit<IShow, "_id">, any> = {
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
  // Optional,
  description: { type: String, default: "" },
  views: { type: Number, default: 0 },
  collaborators: { type: [Schema.Types.ObjectId], ref: UserRef, default: [] },
  tags: { type: [String], default: [] },
  explicit: { type: Boolean, default: false },
  unlisted: { type: Boolean, default: false },
  promotions: { type: Number, default: 0 },
};

const ShowSchema = new Schema(ShowSchemaFields);

const Show = mongoose.model<IShow & Document>(ShowRef, ShowSchema);
export { Show };
