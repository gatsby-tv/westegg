import { Schema } from "mongoose";
import { IChannel } from "./entities/Channel";
import { IVideo } from "./entities/Video";
import { WestEggError } from "./errors";

// Response types

// Generic Responses (not routed)

/**
 * Response that contains an error
 */
export interface ErrorResponse {
  error: WestEggError;
}

/**
 * Response that contains a user login token, most common on login and signup
 */
export interface AuthenticatedResponse {
  token: string;
}

export interface PagedListResponse {
  page: number;
  perPage: number;
}

// Routed Responses

/**
 * POST /auth/signup
 */
export interface SignupResponse extends AuthenticatedResponse {}

/**
 * POST /auth/login
 */
export interface LoginResponse extends AuthenticatedResponse {}

/**
 * POST /channel
 */
export interface CreateChannelResponse extends IChannel {}

/**
 * GET /channel
 */
export interface GetChannelResponse extends IChannel {}

/**
 * GET /channel/list
 */
export interface GetChannelListResponse extends PagedListResponse {
  channels: IChannel[];
}

/**
 * POST /video
 */
export interface UploadVideoResponse extends IVideo {}

/**
 * GET /video
 */
export interface GetVideoResponse extends IVideo {}

/**
 * GET /video/list
 */
export interface GetVideoListResponse extends PagedListResponse {
  videos: IVideo[];
}

// // TODO:
// // PUT /channel
// // DELETE /channel
// // PUT /video
// // DELETE /video
