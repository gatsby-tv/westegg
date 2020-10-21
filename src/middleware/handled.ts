import { getManager as db, ObjectType } from "typeorm";
import validator from "validator";
import { IHandled } from "../types";

const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 16;

export const validateHandle = async (
  handledClass: ObjectType<IHandled>,
  handle: string
) => {
  // Check if handle is already in use
  if (await db().findOne(handledClass, { handle })) {
    throw new Error(`Handle ${handle} is already in use!`);
  }

  if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) {
    throw new Error(
      `Handle must be between ${HANDLE_MIN_LENGTH} and ${HANDLE_MAX_LENGTH} characters!`
    );
  }

  if (!validator.isAlphanumeric(handle)) {
    throw new Error("Display name can only contain alphanumeric characters!");
  }
};
