import { IUserToken } from "../../entities/User";

declare global {
  declare namespace Express {
    interface Request {
      decodedUserToken?: IUserToken;
    }
  }
}
