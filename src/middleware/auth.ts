/**
 * Validate login/signup requests and if users can access other routes.
 */
import { Request, Response } from "express";
import {
  SignupRequest,
  ErrorResponse,
  WestEggError,
  ErrorCode,
  IToken
} from "@gatsby-tv/types";
import validator from "validator";
import { User } from "../entities/User";
import { validateName } from "./named";
import { validateUserHandle } from "./handled";
import jwt from "jsonwebtoken";

const EMAIL_MAX_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const BEARER_PREFIX = "Bearer ";

const validateEmail = async (email: string) => {
  // Check if email is already in use
  if (await User.findOne({ email })) {
    throw new WestEggError(
      ErrorCode.EMAIL_IN_USE,
      `Email ${email} is already in use!`
    );
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    throw new WestEggError(
      ErrorCode.EMAIL_OUT_OF_RANGE,
      `Email must be shorter than ${EMAIL_MAX_LENGTH} characters!`
    );
  }

  if (!validator.isEmail(email)) {
    throw new WestEggError(ErrorCode.INVALID_EMAIL, "Invalid email!");
  }
};

const validatePassword = (
  password: string | undefined,
  confirmPassword: string
) => {
  // Check passwords match
  if (!password || password !== confirmPassword) {
    throw new WestEggError(
      ErrorCode.PASSWORD_DOES_NOT_MATCH,
      "Passwords do not match!"
    );
  }

  // Check password contains at least one number, one lowercase letter, and one capital letter
  if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)) {
    throw new WestEggError(
      ErrorCode.INVALID_PASSWORD,
      "Password must contain at least one number, one lowercase letter, and one capital letter!"
    );
  }

  // Check length of password
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new WestEggError(
      ErrorCode.PASSWORD_OUT_OF_RANGE,
      `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters long!`
    );
  }
};

export const validateSignup = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    // TODO: Validate the json from the request matches interface
    const signup: SignupRequest = req.body;

    // Validate handle
    await validateUserHandle(signup.account.handle);

    // Validate display name
    validateName(signup.account.name);

    // Validate email
    await validateEmail(signup.email);

    // Validate password
    validatePassword(signup.password[0], signup.password[1]);
  } catch (error) {
    // Send bad request if failed to validate
    return res.status(400).json({ error } as ErrorResponse);
  }

  next();
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    // Checks for auth token header
    if (!req.headers.authorization) {
      throw new WestEggError(
        ErrorCode.UNAUTHORIZED,
        "No bearer token set in authorization header!"
      );
    }

    if (!req.headers.authorization.startsWith(BEARER_PREFIX)) {
      throw new WestEggError(
        ErrorCode.UNAUTHORIZED,
        `Bearer token does not start with prefix \"${BEARER_PREFIX}\"!`
      );
    }

    const encodedToken = req.headers.authorization.replace(BEARER_PREFIX, "");

    // Validate jwt secret is present
    if (!process.env.JWT_SECRET) {
      console.error("No jwt secret key set in environment!");
      throw new WestEggError(
        ErrorCode.INTERNAL_ERROR,
        "Invalid server configuration!"
      );
    }

    // Verify the token is authentic
    // TODO: Promisify this and use the async overload
    // https://stackoverflow.com/questions/37833355/how-to-specify-which-overloaded-function-i-want-in-typescript
    const token: IToken = jwt.verify(
      encodedToken,
      process.env.JWT_SECRET
    ) as IToken;

    // TODO: Validate token fields

    // Add the decoded token to the request
    req.decodedUserToken = token;

    next();
  } catch (error) {
    const response: ErrorResponse = {
      error: { name: ErrorCode.UNAUTHORIZED, message: error.message }
    };
    return res.status(401).json(response);
  }
};
