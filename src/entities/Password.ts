import mongoose, { Schema, Document } from "mongoose";
import { UserID } from "@gatsby-tv/types";
import { PasswordRef } from "./refs";

interface IPassword {
  user: UserID;
  password: string;
}

const PasswordSchemaFields: Record<keyof Omit<IPassword, "_id">, any> = {
  // Required
  user: Schema.Types.ObjectId,
  password: String
};

const PasswordSchema = new Schema(PasswordSchemaFields);

// TODO: Refactor password ref to credential or secret
const Password = mongoose.model<IPassword & Document>(
  PasswordRef,
  PasswordSchema
);
export { Password };
