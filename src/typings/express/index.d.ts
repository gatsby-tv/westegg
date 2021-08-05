import { IPFSContent, Token } from "@gatsby-tv/types";
import { ClientSession } from "mongoose";

declare global {
  declare namespace Express {
    interface Request {
      decodedToken?: Token;
      ipfsContent?: IPFSContent;
      session?: ClientSession;
    }
  }
}
