/**
 * Validate login/signup requests and if users can access other routes.
 */
import {
  BadRequest,
  ErrorMessage,
  IToken,
  SignupRequest,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import validator from "validator";
import { User } from "../entities/User";
import { validateUserHandle } from "./handled";
import { validateName } from "./named";

const EMAIL_MAX_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const BEARER_PREFIX = "Bearer ";

const validateEmail = async (email: string) => {
  // Check if email is already in use
  if (await User.findOne({ email })) {
    throw new BadRequest(ErrorMessage.EMAIL_IN_USE);
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    throw new BadRequest(ErrorMessage.EMAIL_OUT_OF_RANGE);
  }

  if (!validator.isEmail(email)) {
    throw new BadRequest(ErrorMessage.INVALID_EMAIL);
  }
};

const validatePassword = (
  password: string | undefined,
  confirmPassword: string
) => {
  // Check passwords match
  if (!password || password !== confirmPassword) {
    throw new BadRequest(ErrorMessage.PASSWORD_DOES_NOT_MATCH);
  }

  // Check password contains at least one number, one lowercase letter, and one capital letter
  if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)) {
    throw new BadRequest(ErrorMessage.INVALID_PASSWORD);
  }

  // Check length of password
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new BadRequest(ErrorMessage.PASSWORD_OUT_OF_RANGE);
  }
};

export const validateSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
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
    next(error);
  }

  next();
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Checks for auth token header
    if (!req.headers.authorization) {
      throw new Unauthorized(ErrorMessage.NO_BEARER_TOKEN_SET);
    }

    if (!req.headers.authorization.startsWith(BEARER_PREFIX)) {
      throw new Unauthorized(ErrorMessage.NO_BEARER_TOKEN_PREFIX);
    }

    const encodedToken = req.headers.authorization.replace(BEARER_PREFIX, "");

    // Validate jwt secret is present
    if (!process.env.JWT_SECRET) {
      console.error("FATAL: No JWT secret key set!");
      process.exit(1);
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
    next(error);
  }
};
