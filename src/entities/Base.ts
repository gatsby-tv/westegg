import { IPFSContent } from "@gatsby-tv/types";
import mongoose, { Schema } from "mongoose";

// TODO: Get IPFS hash to default profile pic
export const DEFAULT_AVATAR: IPFSContent = {
  hash: "1234",
  mimeType: "image/jpeg"
};
