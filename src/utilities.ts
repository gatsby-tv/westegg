import { Schema } from "mongoose";

// Compare two mongo ids (can be strings or ObjectIDs)
export function compareMongoIDs(
  left: string | Schema.Types.ObjectId,
  right: string | Schema.Types.ObjectId
): boolean {
  return left.toString() === right.toString();
}

// Generate a random string
export function randomString(length: number = 8) {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, length);
}
