import { Schema } from "mongoose";
import { IUserToken } from "./entities/User";
import { IFiltered, IHandled, INamed } from "./types";

// Request types

// Generic Requests (not routed)

/**
 * Requests that can only be made when logged in as a user.
 * Token sent initially as string, then decoded to IUserToken object.
 */
export interface AuthenticatedRequest {
  token: string;
  // IUserToken should not be sent by the client, this is decoded from token sent and appended by the backend
  user?: IUserToken;
}

/**
 * Requests that make changes to a channel (upload video, update the display name, etc)
 */
export interface UpdateChannelRequest extends AuthenticatedRequest {
  channel: Schema.Types.ObjectId;
}

/**
 * Requests that return many items from the db, filtered by a key/value pair
 */
export interface FilteredListRequest {
  filter?: IFiltered;
}

/**
 * Requests that return a list, but only a specific chunk (page)
 */
export interface PagedListRequest {
  page: number;
  perPage: number;
}

// Routed Requests

/**
 * POST /auth/signup
 */
export interface SignupRequest extends IHandled, INamed {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * POST /auth/login
 */
export interface LoginRequest {
  handle?: string;
  email?: string;
  password: string;
}

/**
 * POST /channel
 */
export interface CreateChannelRequest extends AuthenticatedRequest {
  handle: string;
  displayName: string;
}

/**
 * GET /channel
 */
export interface GetChannelRequest {
  id?: Schema.Types.ObjectId;
  handle: string;
}

/**
 * GET /channel/list
 */
export interface GetChannelListRequest
  extends FilteredListRequest,
    PagedListRequest {}

/**
 * POST /video
 */
export interface UploadVideoRequest extends UpdateChannelRequest {
  title: string;
  description: string;
  hash: string;
  thumbnailHash: string;
  // Channel, Show, Series, or Sequence to upload to
  uploadable: Schema.Types.ObjectId;
}

/**
 * GET /video
 */
export interface GetVideoRequest {
  id?: Schema.Types.ObjectId;
  hash: string;
}

/**
 * GET /video/list
 */
export interface GetVideoListRequest
  extends FilteredListRequest,
    PagedListRequest {}

// TODO:
// PUT /channel
// DELETE /channel
// PUT /video
// DELETE /video
