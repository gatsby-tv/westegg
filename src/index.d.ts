import { IPFSContent, Token } from "@gatsby-tv/types";
import { Types } from "mongoose";

declare global {
  declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "staging" | "production";
      [key: string]: string | undefined;
    }
  }

  declare namespace Express {
    interface Request {
      decodedToken?: Token;
      ipfsContent?: IPFSContent;
      cursor: Types.ObjectId;
      limit: number;
    }
  }
}
