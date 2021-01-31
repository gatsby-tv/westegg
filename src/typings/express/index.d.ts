import { Token } from "@gatsby-tv/types";

declare global {
  declare namespace Express {
    interface Request {
      decodedToken?: Token;
    }
  }
}
