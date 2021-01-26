import { BadRequest, ErrorMessage } from "@gatsby-tv/types";
import validator from "validator";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";

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
  if (await User.findById(handle)) {
    throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
  }

  await validateHandle(handle);
};

export const validateChannelHandle = async (handle: string) => {
  // Validate if handle in use
  if (await Channel.findById(handle)) {
    throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
  }

  await validateHandle(handle);
};
