import { Schema } from "mongoose";

export function compareMongoIDs(
  left: string | Schema.Types.ObjectId,
  right: string | Schema.Types.ObjectId
): boolean {
  return left.toString() === right.toString();
}
