// Entity types
export interface IUser {
  handle: string;
  displayName: string;
  email: string;
}

// Request types
export type SignupRequest = {
  handle: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  email: string;
};

export type LoginRequest = {
  handle?: string;
  email?: string;
  password: string;
};

/**
 * Requests that can only be made when logged in as a user.
 * Token sent initially as string, then decoded to IUser object.
 */
export interface AuthenticatedRequest {
  token: string;
  // IUser should not be sent by the client, this is decoded from token sent
  user?: IUser;
}

export interface CreateChannelRequest extends AuthenticatedRequest {
  handle: string;
  displayName: string;
}
