import mongoose, { Schema, Document } from "mongoose";
import { UploadableCollection, UploadableRef, VideoRef } from "./refs";

// Interface
interface IUploadable {
  videos: Schema.Types.ObjectId[];
}

// DB Implementation (Abstract)
const UploadableSchemaFields: Record<keyof IUploadable, any> = {
  videos: [{ type: Schema.Types.ObjectId, ref: VideoRef }]
};

const UploadableSchema = new Schema(UploadableSchemaFields);

const Uploadable = mongoose.model<IUploadable & Document>(
  UploadableRef,
  UploadableSchema,
  UploadableCollection
);
export { IUploadable, Uploadable, UploadableSchema };
