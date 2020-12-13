import { Schema } from "mongoose";
import { IHandled, INamed } from "./types";

// Request types

// Generic Requests (not routed)

/**
 * Requests that make changes to a channel (upload video, update the display name, etc)
 */
export interface UpdateChannelRequest {
  id: Schema.Types.ObjectId;
}

/**
 * Requests that return many items from the db, filtered by a key/value pair
 */
export interface FilteredListRequest {
  filterKey: string;
  filterValue: string;
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
export interface CreateChannelRequest {
  handle: string;
  displayName: string;
}

/**
 * GET /channel
 */
export interface GetChannelRequest {
  id?: Schema.Types.ObjectId;
  handle?: string;
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
  hash?: string;
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

// TODO: Helper middleware that iterates through an interfaces properties and parses a plain object into the interface with understandle errors to send back to client if not correct. Handles casting strings to various primitives.
