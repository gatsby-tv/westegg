import validator from "validator";
import { User } from "../entities/User";
import { BadRequest, ErrorMessage } from "@gatsby-tv/types";
import { Channel } from "../entities/Channel";

const HANDLE_MIN_LENGTH = 4;
const HANDLE_MAX_LENGTH = 16;

const validateHandle = async (handle: string) => {
  if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) {
    throw new BadRequest(ErrorMessage.HANDLE_OUT_OF_RANGE);
  }

  if (!validator.isAlphanumeric(handle.replace(/_/g, ""))) {
    throw new BadRequest(ErrorMessage.INVALID_HANDLE);
  }
};

export const validateUserHandle = async (handle: string) => {
  // Validate if handle in use
  if (await User.findOne({ handle })) {
    throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
  }

  await validateHandle(handle);
};

export const validateChannelHandle = async (handle: string) => {
  // Validate if handle in use
  if (await Channel.findOne({ handle })) {
    throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
  }

  await validateHandle(handle);
};
