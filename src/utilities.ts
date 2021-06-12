import { Schema } from "mongoose";

// Compare two mongo ids (can be strings or ObjectIDs)
export function compareMongoIDs(
  left: string | Schema.Types.ObjectId,
  right: string | Schema.Types.ObjectId
): boolean {
  return left.toString() === right.toString();
}

// Map an array of keys (usually a response type) into a mongo projection
export function project(keys: string[]): any {
  return keys.reduce(
    (result: any, key: any) => ((result[key] = 1), result),
    {}
  );
}

// Generate a random string
export function randomString(length: number = 8) {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, length);
}
