import { ErrorCode, WestEggError } from "@gatsby-tv/types";

const DISPLAY_NAME_MIN_LENGTH = 1;
const DISPLAY_NAME_MAX_LENGTH = 50;

export const validateName = (name: string) => {
  if (
    name.length < DISPLAY_NAME_MIN_LENGTH ||
    name.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    throw new WestEggError(
      ErrorCode.DISPLAY_NAME_OUT_OF_RANGE,
      `Display name must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters!`
    );
  }
};
