/**
 * Validate login/singup reqeusts and if users can access other routes.
 */
import { Request, Response } from "express";
import { SignupRequest } from "../types";
import validator from "validator";
import {
  HANDLE_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH
} from "../entities/User";

const validateHandle = (handle: string) => {
  if (handle.length > HANDLE_MAX_LENGTH) {
    throw new Error(`Handle must be shorter than ${HANDLE_MAX_LENGTH} characters!`);
  }

  if (!validator.isAlphanumeric(handle)) {
    throw new Error("Display name can only contain alphanumeric characters!");
  }
};

const validateDisplayName = (displayName: string) => {
  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    throw new Error(`Display name must be shorter than ${DISPLAY_NAME_MAX_LENGTH} characters!`);
  }
};

const validateEmail = (email: string) => {
  if (email.length > EMAIL_MAX_LENGTH) {
    throw new Error(`Email must be shorter than ${EMAIL_MAX_LENGTH} characters!`);
  }

  if (!validator.isEmail(email)) {
    throw new Error("Invalid email!");
  }
};

const valiatePassword = (password: string, confirmPassword: string) => {
  // Check passwords match
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match!");
  }

  // Check password contains at least one number, one lowercase letter, and one capital letter
  if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)) {
    throw new Error("Password must contain at least one number, one lowercase letter, and one capital letter!");
  }

  // Check length of password
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters long!`);
  }
};

export const validateSignup = (req: Request, res: Response, next: () => void) => {
  const signup: SignupRequest = req.body;

  // Validate handle
  validateHandle(signup.handle);

  // Validate display name
  validateDisplayName(signup.displayName);

  // Validate email
  validateEmail(signup.email);

  // Validate password
  valiatePassword(signup.password, signup.confirmPassword);

  next();
};

// TODO: isAuthenticated
// TODO: hasVerifiedEmail
