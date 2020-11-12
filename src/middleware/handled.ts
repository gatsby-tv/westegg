import validator from "validator";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";
import { ErrorCode, WestEggError } from "../errors";

const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 16;

const validateHandle = async (handle: string) => {
  if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) {
    throw new WestEggError(
      ErrorCode.HANDLE_OUT_OF_RANGE,
      `Handle must be between ${HANDLE_MIN_LENGTH} and ${HANDLE_MAX_LENGTH} characters!`
    );
  }

  if (!validator.isAlphanumeric(handle.replace(/_/g, ""))) {
    throw new WestEggError(
      ErrorCode.INVALID_HANDLE,
      "Handle can only contain alphanumeric characters!"
    );
  }
};

export const validateUserHandle = async (handle: string) => {
  // Validate if handle in use
  if (await User.findOne({ handle })) {
    throw new WestEggError(
      ErrorCode.HANDLE_IN_USE,
      `Handle ${handle} is already in use!`
    );
  }

  await validateHandle(handle);
};

export const validateChannelHandle = async (handle: string) => {
  // Validate if handle in use
  if (await Channel.findOne({ handle })) {
    throw new WestEggError(
      ErrorCode.HANDLE_IN_USE,
      `Handle ${handle} is already in use!`
    );
  }

  await validateHandle(handle);
};
