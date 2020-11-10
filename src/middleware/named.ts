import { ErrorCode, WestEggError } from "../errors";

const DISPLAY_NAME_MIN_LENGTH = 3;
const DISPLAY_NAME_MAX_LENGTH = 64;

export const validateDisplayName = (displayName: string) => {
  if (
    displayName.length < DISPLAY_NAME_MIN_LENGTH ||
    displayName.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    throw new WestEggError(
      ErrorCode.DISPLAY_NAME_OUT_OF_RANGE,
      `Display name must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters!`
    );
  }
};
