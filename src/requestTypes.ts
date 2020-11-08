import { Schema } from "mongoose";
import { IUserToken } from "./entities/User";
import { IHandled, INamed } from "./types";

// Request types

// Generic Requests (not routed)

/**
 * Requests that can only be made when logged in as a user.
 * Token sent initially as string, then decoded to IUserToken object.
 */
export interface AuthenticatedRequest {
  token: string;
  // IUserToken should not be sent by the client, this is decoded from token sent
  user?: IUserToken;
}

/**
 * Requests that make changes to a channel (upload video, update the display name, etc)
 */
export interface UpdateChannelRequest extends AuthenticatedRequest {
  channel: Schema.Types.ObjectId;
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

// TODO:
// GET /channel
// PUT /channel
// DELETE /channel
// GET /video
// GET /video/list
// PUT /video
// DELETE /video
