import { Types } from "mongoose";

export const DEFAULT_CURSOR_LIMIT = 24;
export const CURSOR_START = new Types.ObjectId("0".repeat(24));

export type CursorListing<T> = {
  content: Array<T>;
  next: string;
};

// Shim to fill missing videos/channels for low content on pre-alpha site
export function preAlphaFillListing<T>(
  list: Array<T>,
  limit: number
): CursorListing<T> {
  // Start pre-alpha demo code block
  let duplicate = Array(limit - list.length)
    .fill(null)
    .map((item, index) => {
      return list[index % list.length];
    });

  // Wrap content as single request will have all that's in pre-alpha
  const nextCursor = CURSOR_START;

  return {
    content: [...list, ...duplicate],
    next: nextCursor.toString()
  };
  // End pre-alpha demo code block
}
