import { Schema } from "mongoose";
import { IUserToken } from "./entities/User";

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
 * Token sent initially as string, then decoded to IUserToken object.
 */
export interface AuthenticatedRequest {
  token: string;
  // IUserToken should not be sent by the client, this is decoded from token sent
  user?: IUserToken;
}

export interface CreateChannelRequest extends AuthenticatedRequest {
  handle: string;
  displayName: string;
}

export interface UpdateChannelRequest extends AuthenticatedRequest {
  channel: Schema.Types.ObjectId;
}

export interface UploadVideoRequest extends UpdateChannelRequest {
  title: string;
  description: string;
  hash: string;
  thumbnailHash: string;
  // Channel, Show, Series, or Sequence to upload to
  uploadable: Schema.Types.ObjectId;
}
