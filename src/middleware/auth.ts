/**
 * Validate login/signup requests and if users can access other routes.
 */
import { Request, Response } from "express";
import {
  AuthenticatedRequest,
  SignupRequest,
  UpdateChannelRequest
} from "../requestTypes";
import validator from "validator";
import { IUserToken, User } from "../entities/User";
import { validateDisplayName } from "./named";
import { validateUserHandle } from "./handled";
import jwt from "jsonwebtoken";
import { Channel } from "../entities/Channel";

const EMAIL_MAX_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

const validateEmail = async (email: string) => {
  // Check if email is already in use
  if (await User.findOne({ email })) {
    throw new Error(`Email ${email} is already in use!`);
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    throw new Error(
      `Email must be shorter than ${EMAIL_MAX_LENGTH} characters!`
    );
  }

  if (!validator.isEmail(email)) {
    throw new Error("Invalid email!");
  }
};

const validatePassword = (
  password: string | undefined,
  confirmPassword: string
) => {
  // Check passwords match
  if (!password || password !== confirmPassword) {
    throw new Error("Passwords do not match!");
  }

  // Check password contains at least one number, one lowercase letter, and one capital letter
  if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)) {
    throw new Error(
      "Password must contain at least one number, one lowercase letter, and one capital letter!"
    );
  }

  // Check length of password
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new Error(
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
    const signup: SignupRequest = req.body;

    // Validate handle
    await validateUserHandle(signup.handle);

    // Validate display name
    validateDisplayName(signup.displayName);

    // Validate email
    await validateEmail(signup.email);

    // Validate password
    validatePassword(signup.password, signup.confirmPassword);
  } catch (error) {
    // Send bad request if failed to validate
    return res.status(400).json({ error: error.message });
  }

  next();
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    const request: AuthenticatedRequest = req.body;

    // Verify the token is authentic
    // TODO: Promisify this and use the async overload
    // https://stackoverflow.com/questions/37833355/how-to-specify-which-overloaded-function-i-want-in-typescript
    const token: IUserToken = jwt.verify(
      request.token,
      process.env.JWT_SECRET!
    ) as IUserToken;

    // Add the decoded token to the request
    request.user = token;

    next();
  } catch (error) {
    return res.sendStatus(401);
  }
};

export const ownsChannel = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  try {
    const request: UpdateChannelRequest = req.body;

    // Get the channel we want to modify
    const channel = await Channel.findOne({ _id: request.channel });
    if (channel?.owner.toString() !== request.user?._id.toString()) {
      throw new Error(
        "User does not have permission to update the requested channel!"
      );
    }

    next();
  } catch (error) {
    return res.sendStatus(401);
  }
};

// TODO: hasVerifiedEmail
