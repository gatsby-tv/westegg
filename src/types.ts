import { Schema } from "mongoose";
import { IUser } from "./entities/User";

// Abstract entity types
export interface IHandled {
  handle: string;
}

export interface INamed {
  displayName: string;
}

// export interface IUploadable {
//   videos: Schema.Types.ObjectId[];
// }

// Request types
export interface SignupRequest extends IHandled, INamed {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  handle?: string;
  email?: string;
  password: string;
}

/**
 * Requests that can only be made when logged in as a user.
 * Token sent initially as string, then decoded to IUser object.
 */
export interface AuthenticatedRequest {
  token: string;
  // IUser should not be sent by the client, this is decoded from token sent
  user?: IUser;
}

export interface CreateChannelRequest extends AuthenticatedRequest {
  handle: string;
  displayName: string;
}
