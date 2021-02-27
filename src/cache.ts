/**
 * This file handles all calls to redis when making requests that require getting the same resource many times.
 *
 * TODO: This is where I'd put a cache, IF I HAD ONE!
 * TODO: Use cachegoose: https://www.npmjs.com/package/cachegoose to cache queries made to mongo in redis.
 */

import {
  ChannelID,
  ErrorMessage,
  NotFound,
  UserID,
  VideoID
} from "@gatsby-tv/types";
import { Channel } from "./entities/Channel";
import { User } from "./entities/User";
import { Video } from "./entities/Video";

export async function getCachedUserById(id: UserID) {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFound(ErrorMessage.USER_NOT_FOUND);
  }
  return user;
}

export async function getCachedChannelById(id: ChannelID) {
  const channel = await Channel.findById(id);
  if (!channel) {
    throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
  }
  return channel;
}

export async function getCachedVideoById(id: VideoID) {
  const video = await Video.findById(id);
  if (!video) {
    throw new NotFound(ErrorMessage.VIDEO_NOT_FOUND);
  }
  return video;
}
