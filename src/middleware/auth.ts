import {
  BadRequest,
  ErrorMessage,
  IChannel,
  IUser,
  IVideo,
  PostAuthSignInRequest,
  PostUserCompleteSignupRequest,
  Token,
  Unauthorized
} from "@gatsby-tv/types";
import { InvalidToken } from "@src/entities/InvalidToken";
import { validateHandle } from "@src/middleware/handled";
import { validateName } from "@src/middleware/named";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import validator from "validator";

const BEARER_PREFIX = "Bearer ";
const MILLISECONDS_IN_SECONDS = 1000;

export const validateSignin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signin = req.body as PostAuthSignInRequest;

  // Validate email is proper format
  if (!validator.isEmail(signin.email)) {
    throw new BadRequest(ErrorMessage.INVALID_EMAIL);
  }
  next();
};

export const validateSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signup = req.body as PostUserCompleteSignupRequest;

  // Validate handle
  validateHandle(signup.handle);

  // Validate display name
  validateName(signup.name);

  next();
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  // https://stackoverflow.com/questions/37833355/how-to-specify-which-overloaded-function-i-want-in-typescript
  let token = null;
  try {
    token = jwt.verify(
      encodedToken,
      process.env.JWT_SECRET!
    ) as unknown as Token;
  } catch (error) {
    throw new Unauthorized(ErrorMessage.UNAUTHORIZED);
  }

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
    if (new Types.ObjectId(actor._id).equals(new Types.ObjectId(user._id))) {
      return true;
    }
  } else if (isChannel(resource)) {
    let channel: IChannel = resource as IChannel;
    for (let owner of channel.owners) {
      // Check if the actor is one of the channel owners
      // No need to check method, owners can perform all actions
      if (new Types.ObjectId(actor._id).equals(new Types.ObjectId(owner))) {
        return true;
      }
    }
    // TODO:
  } else if (isVideo(resource)) {
    // TODO:
  }

  return false;
}
