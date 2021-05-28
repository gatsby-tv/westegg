import {
  BadRequest,
  ErrorMessage,
  IChannel,
  IUser,
  IVideo,
  PostAuthCompleteSignUpRequest,
  PostAuthSignInRequest,
  Token,
  Unauthorized
} from "@gatsby-tv/types";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import validator from "validator";
import { InvalidToken } from "../entities/InvalidToken";
import { compareMongoIDs } from "../utilities";
import { validateUserHandle } from "./handled";
import { validateName } from "./named";

const BEARER_PREFIX = "Bearer ";
const MILLISECONDS_IN_SECONDS = 1000;

export const validateSignin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signin = req.body as PostAuthSignInRequest;

    // Validate email is proper format
    if (!validator.isEmail(signin.email)) {
      throw new BadRequest(ErrorMessage.INVALID_EMAIL);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signup = req.body as PostAuthCompleteSignUpRequest;

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

    // Check if the token is expired by the invalid tokens collection
    const invalid = await InvalidToken.findById(token._id);
    // Convert JWT NumericDate to Date
    // See: https://stackoverflow.com/questions/39926104/what-format-is-the-exp-expiration-time-claim-in-a-jwt
    if (
      invalid &&
      invalid.expire > new Date(parseInt(token.iat) * MILLISECONDS_IN_SECONDS)
    ) {
      throw new Unauthorized(ErrorMessage.TOKEN_EXPIRED);
    }

    // Add the decoded token to the request
    req.decodedToken = token;

    next();
  } catch (error) {
    next(error);
  }
};

export enum ResourceAction {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

type Resource = IUser | IChannel | IVideo;

// TODO: Move these to types/utilities and use better props for this?
function isUser(resource: Resource): resource is IUser {
  return (resource as IUser).channels !== undefined;
}

function isChannel(resource: Resource): resource is IChannel {
  return (resource as IChannel).videos !== undefined;
}

function isVideo(resource: Resource): resource is IVideo {
  return (resource as IVideo).views !== undefined;
}

/**
 * Check if a user has permission to perform an action on a resource (other user/channel/video/etc).
 *
 * @param {IUser} actor The user performing an operation on the resource.
 * @param {Resource} resource A user/channel/video/etc that the actor is trying to perform an action on.
 * @param {ResourceAction} method The action the actor is attempting to perform on the resource.
 */
export function hasPermission(
  actor: IUser,
  resource: Resource,
  method: ResourceAction
): boolean {
  if (isUser(resource)) {
    let user: IUser = resource as IUser;
    // Check if the actor is the same user
    // No need to check for method here, owner can perform all actions
    if (compareMongoIDs(actor._id, user._id)) {
      return true;
    }
  } else if (isChannel(resource)) {
    let channel: IChannel = resource as IChannel;
    for (let owner of channel.owners) {
      // Check if the actor is one of the channel owners, no need to check method, owners can perform all actions
      if (compareMongoIDs(actor._id, owner)) {
        return true;
      }
    }
    // TODO:
  } else if (isVideo(resource)) {
    // TODO:
  }

  return false;
}
