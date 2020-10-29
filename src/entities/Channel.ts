import mongoose, { Schema, Document } from "mongoose";
import { IHandled, INamed } from "../types";
import { ChannelRef, UploadableCollection, UserRef } from "./refs";
import { UploadableSchema } from "./Uploadable";

// Interface
interface IChannel extends IHandled, INamed {
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
  owner: { type: Schema.Types.ObjectId, ref: UserRef }
};

const ChannelSchema = new Schema(UploadableSchema);
ChannelSchema.add(ChannelSchemaFields);

const Channel = mongoose.model<IChannel & Document>(
  ChannelRef,
  ChannelSchema,
  UploadableCollection
);
export { IChannel, Channel };
