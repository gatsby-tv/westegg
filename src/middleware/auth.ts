/**
 * Validate login/signup requests and if users can access other routes.
 */
import {
  ErrorMessage,
  PostAuthSignupRequest,
  Token,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { validateUserHandle } from "./handled";
import { validateName } from "./named";

const BEARER_PREFIX = "Bearer ";

export const validateSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: Validate the json from the request matches interface
    const signup: PostAuthSignupRequest = req.body;

    // Validate handle
    await validateUserHandle(signup.handle);

    // Validate display name
    validateName(signup.name);
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

    // Verify the token is authentic
    // TODO: Promisify this and use the async overload
    // TODO: Add try/catch to for token validation
    // https://stackoverflow.com/questions/37833355/how-to-specify-which-overloaded-function-i-want-in-typescript
    const token: Token = jwt.verify(
      encodedToken,
      process.env.JWT_SECRET!
    ) as Token;

    // Add the decoded token to the request
    req.decodedToken = token;

    next();
  } catch (error) {
    next(error);
  }
};
