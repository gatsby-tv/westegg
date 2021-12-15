export class WestEggError extends Error {
  status: StatusCode;
  message: ErrorMessage;

  constructor(status: StatusCode, message: ErrorMessage) {
    super();
    this.message = message;
    this.status = status;
  }

  public toString = (): string => {
    return `${this.status}: ${this.message}`;
  };
}

export class NotFound extends WestEggError {
  constructor(message: ErrorMessage) {
    super(StatusCode.NOT_FOUND, message);
  }
}

export class BadRequest extends WestEggError {
  constructor(message: ErrorMessage) {
    super(StatusCode.BAD_REQUEST, message);
  }
}

export class InternalError extends WestEggError {
  constructor() {
    super(StatusCode.INTERNAL_ERROR, ErrorMessage.INTERNAL_ERROR);
  }
}

export class Unauthorized extends WestEggError {
  constructor(message: ErrorMessage) {
    super(StatusCode.UNAUTHORIZED, message);
  }
}

export class Forbidden extends WestEggError {
  constructor(message: ErrorMessage) {
    super(StatusCode.FORBIDDEN, message);
  }
}

export enum StatusCode {
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  INTERNAL_ERROR = 500,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204
}

export enum ErrorMessage {
  // Common HTTP error responses
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Object ID
  INVALID_OBJECT_ID = "INVALID_OBJECT_ID",

  // Auth
  HANDLE_OR_EMAIL_REQUIRED = "HANDLE_OR_EMAIL_REQUIRED",
  NO_BEARER_TOKEN_SET = "NO_BEARER_TOKEN_SET",
  NO_BEARER_TOKEN_PREFIX = "NO_BEARER_TOKEN_PREFIX",
  SIGNIN_KEY_NOT_FOUND = "SIGNIN_KEY_NOT_FOUND",

  // Email
  INVALID_EMAIL = "INVALID_EMAIL",
  EMAIL_IN_USE = "EMAIL_IN_USE",

  // Handle
  HANDLE_OUT_OF_RANGE = "HANDLE_OUT_OF_RANGE",
  INVALID_HANDLE = "INVALID_HANDLE",
  HANDLE_IN_USE = "HANDLE_IN_USE",

  // Name
  NAME_OUT_OF_RANGE = "NAME_OUT_OF_RANGE",

  // User
  USER_FORBIDDEN_TO_PERFORM_ACTION = "USER_FORBIDDEN_TO_PERFORM_ACTION",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  SUBSCRIPTION_ALREADY_EXISTS = "SUBSCRIPTION_ALREADY_EXISTS",

  // Channel
  CHANNEL_NOT_FOUND = "CHANNEL_NOT_FOUND",

  // Video
  VIDEO_ALREADY_EXISTS = "VIDEO_ALREADY_EXISTS",
  VIDEO_TITLE_OUT_OF_RANGE = "VIDEO_TITLE_OUT_OF_RANGE",
  VIDEO_DESCRIPTION_OUT_OF_RANGE = "VIDEO_DESCRIPTION_OUT_OF_RANGE",
  VIDEO_NOT_FOUND = "VIDEO_NOT_FOUND",

  // Tokens
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Files
  INVALID_FILE_SIZE = "INVALID_FILE_SIZE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",

  // Tags
  INVALID_TAG = "INVALID_TAG",
  TAG_OUT_OF_RANGE = "TAG_OUT_OF_RANGE"
}
