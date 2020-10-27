import { Schema } from "mongoose";
import { VideoRef } from "./refs";

// Interface
interface IUploadable {
  videos: Schema.Types.ObjectId[];
}

// DB Implementation (Abstract)
const UploadableSchemaFields: Record<keyof IUploadable, any> = {
  videos: [{ type: Schema.Types.ObjectId, ref: VideoRef }]
};

const UploadableSchema = new Schema(UploadableSchemaFields);

export { IUploadable, UploadableSchema };
