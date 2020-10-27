import validator from "validator";
import { Channel } from "../entities/Channel";
import { User } from "../entities/User";

const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 16;

const validateHandle = async (handle: string) => {
  if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) {
    throw new Error(
      `Handle must be between ${HANDLE_MIN_LENGTH} and ${HANDLE_MAX_LENGTH} characters!`
    );
  }

  if (!validator.isAlphanumeric(handle)) {
    throw new Error("Handle can only contain alphanumeric characters!");
  }
};

export const validateUserHandle = async (handle: string) => {
  // Validate if handle in use
  if (await User.findOne({ handle })) {
    throw new Error(`Handle ${handle} is already in use!`);
  }

  await validateHandle(handle);
};

export const validateChannelHandle = async (handle: string) => {
  // Validate if handle in use
  if (await Channel.findOne({ handle })) {
    throw new Error(`Handle ${handle} is already in use!`);
  }

  await validateHandle(handle);
};
