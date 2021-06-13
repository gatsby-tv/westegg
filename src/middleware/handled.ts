import { BadRequest, ErrorMessage } from "@gatsby-tv/types";
import validator from "validator";

const HANDLE_MIN_LENGTH = 4;
const HANDLE_MAX_LENGTH = 21;

export const validateHandle = (handle: string) => {
  if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) {
    throw new BadRequest(ErrorMessage.HANDLE_OUT_OF_RANGE);
  }

  if (!validator.isAlphanumeric(handle.replace(/_/g, ""))) {
    throw new BadRequest(ErrorMessage.INVALID_HANDLE);
  }
};
