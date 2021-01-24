import { BadRequest, ErrorMessage } from "@gatsby-tv/types";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 50;

export const validateName = (name: string) => {
  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    throw new BadRequest(ErrorMessage.NAME_OUT_OF_RANGE);
  }
};
