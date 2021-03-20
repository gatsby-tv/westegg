import { Schema } from "mongoose";

// Compare two mongo ids (can be strings or ObjectIDs)
export function compareMongoIDs(
  left: string | Schema.Types.ObjectId,
  right: string | Schema.Types.ObjectId
): boolean {
  return left.toString() === right.toString();
}
