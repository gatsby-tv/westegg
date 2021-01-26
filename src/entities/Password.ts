import { UserID } from "@gatsby-tv/types";
import mongoose, { Document, Schema } from "mongoose";
import { PasswordRef, UserRef } from "./refs";

interface IPassword {
  user: UserID;
  password: string;
}

const PasswordSchemaFields: Record<keyof Omit<IPassword, "_id">, any> = {
  // Required
  user: { type: String, ref: UserRef },
  password: String
};

const PasswordSchema = new Schema(PasswordSchemaFields);

// TODO: Refactor password ref to credential or secret
const Password = mongoose.model<IPassword & Document>(
  PasswordRef,
  PasswordSchema
);
export { Password };
