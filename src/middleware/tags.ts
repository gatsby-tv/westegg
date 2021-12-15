import { BadRequest, ErrorMessage } from "@gatsby-tv/types";
import validator from "validator";

const TAG_MIN_LENGTH = 3;
const TAG_MAX_LENGTH = 35;

export const validateTag = (tag: string) => {
  if (tag.length < TAG_MIN_LENGTH || tag.length > TAG_MAX_LENGTH) {
    throw new BadRequest(ErrorMessage.TAG_OUT_OF_RANGE);
  }

  if (!validator.isAlphanumeric(tag)) {
    throw new BadRequest(ErrorMessage.INVALID_TAG);
  }
};
