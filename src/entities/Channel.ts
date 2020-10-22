import mongoose, { Schema, Document } from "mongoose";
import { IHandled, INamed, IUploadable } from "../types";
import { ChannelRef, UserRef, VideoRef } from "./refs";

// Interface
interface IChannel extends IHandled, INamed, IUploadable {
  owner: Schema.Types.ObjectId;
  // TODO:
  // shows
  // serieses
  // sequences
  // collaborators
}

// DB Implementation
const ChannelSchemaFields: Record<keyof IChannel, any> = {
  handle: String,
  displayName: String,
  videos: [{ type: Schema.Types.ObjectId, ref: VideoRef }],
  owner: { type: Schema.Types.ObjectId, ref: UserRef }
};

const ChannelSchema = new Schema(ChannelSchemaFields);

const Channel = mongoose.model<IChannel & Document>(ChannelRef, ChannelSchema);
export { IChannel, Channel };
