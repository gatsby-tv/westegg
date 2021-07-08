import { logger } from "./logger";

export enum Environment {
  DEV = "dev",
  STAGING = "staging",
  PRODUCTION = "production"
}

const SECRET_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\!\@\#\$\%\^\&\*\(\)\_\+])[0-9a-zA-Z\!\@\#\$\%\^\&\*\(\)\_\+\/\,\.\<\\\>\{\}\[\]\;\:\`\-\+\=]{64,}$/;
const IPFS_HOST_REGEX = /^http(s)?:\/\/[a-zA-Z0-9\%\.\_\+\~\#\=]{1,256}\:[0-9]{1,5}([a-zA-Z0-9\(\)\@\:\%\_\+\.\~\#\?\&\/\=]*)$/;
const MONGO_HOST_REGEX = /^[a-zA-Z0-9\%\.\_\+\~\#\=\-]{1,256}$/;
const SENDGRID_API_KEY_REGEX = /^SG\..{1,256}$/;

// Check all environment variables are properly set and valid, exit if not
export function validateEnvironment() {
  try {
    // Check environment is properly set
    if (
      !process.env.WESTEGG_ENV ||
      (Environment.DEV !== process.env.WESTEGG_ENV &&
        Environment.STAGING !== process.env.WESTEGG_ENV &&
        Environment.PRODUCTION !== process.env.WESTEGG_ENV)
    ) {
      throw new Error(
        'Environment not set to "dev", "staging", or "production"!'
      );
    }

    // Warn on "dev" environment set
    if (Environment.DEV === process.env.WESTEGG_ENV) {
      logger.warn("Environment set to dev, DO NOT RUN IN PRODUCTION!");
    }

    // Validate JWT secret key is set
    if (!process.env.JWT_SECRET) {
      throw new Error("No JWT secret key set!");
    }

    // Verify environment variables
    if (
      Environment.PRODUCTION === process.env.WESTEGG_ENV ||
      Environment.STAGING === process.env.WESTEGG_ENV
    ) {
      let regexMatch = process.env.JWT_SECRET?.match(SECRET_REGEX) as string[];
      let matchString = regexMatch?.join("");
      if (matchString !== process.env.JWT_SECRET) {
        throw new Error("JWT secret key not complex enough!");
      }
    }

    // Validate MongoDB related environment variables
    if (
      !process.env.MONGO_PROTOCOL ||
      (process.env.MONGO_PROTOCOL !== "mongodb" &&
        process.env.MONGO_PROTOCOL !== "mongodb+srv")
    ) {
      throw new Error("MongoDB protocol missing or malformed!");
    }

    if (!process.env.MONGO_HOST) {
      throw new Error("MongoDB host missing!");
    } else {
      let regexMatch = process.env.MONGO_HOST?.match(
        MONGO_HOST_REGEX
      ) as string[];
      let matchString = regexMatch?.join("");
      if (!process.env.MONGO_HOST || matchString !== process.env.MONGO_HOST) {
        throw new Error("MongoDB host missing or malformed!");
      }
    }

    if (!process.env.MONGO_API_PASS) {
      throw new Error("MongoDB api password missing!");
    }

    if (
      Environment.PRODUCTION === process.env.WESTEGG_ENV ||
      Environment.STAGING === process.env.WESTEGG_ENV
    ) {
      let regexMatch = process.env.IPFS_URL?.match(IPFS_HOST_REGEX) as string[];
      let matchString = regexMatch?.join("");
      if (matchString !== process.env.IPFS_URL || !process.env.IPFS_URL) {
        throw new Error("IPFS host missing or malformed!");
      }
    }

    // Validate Sendgrid API key
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SendGrid API key missing!");
    }

    if (
      Environment.PRODUCTION === process.env.WESTEGG_ENV ||
      Environment.STAGING === process.env.WESTEGG_ENV
    ) {
      let regexMatch = process.env.SENDGRID_API_KEY?.match(
        SENDGRID_API_KEY_REGEX
      ) as string[];
      let matchString = regexMatch?.join("");
      if (matchString !== process.env.SENDGRID_API_KEY) {
        throw new Error("SendGrid API key malformed!");
      }
    }
  } catch (error) {
    logger.error(`FATAL: ${error}`);
    process.exit(1);
  }
}
