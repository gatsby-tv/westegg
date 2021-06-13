import { logger } from "./logger";

export enum Environment {
  DEV = "dev",
  STAGING = "staging",
  PRODUCTION = "production"
}

const secretRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\!\@\#\$\%\^\&\*\(\)\_\+])[0-9a-zA-Z\!\@\#\$\%\^\&\*\(\)\_\+\/\,\.\<\\\>\{\}\[\]\;\:\`\-\+\=]{64,}$/;

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

    if (Environment.DEV === process.env.WESTEGG_ENV) {
      let regexMatch = process.env.JWT_SECRET.match(secretRegex) as string[];
      let matchString = regexMatch?.join();
      if (matchString !== process.env.JWT_SECRET) {
        throw new Error("JWT secret key not complex enough!");
      }
    }

    // TODO: Validate mongo url format

    // TODO: Validate IPFS url format
  } catch (error) {
    logger.error(`FATAL: ${error}`);
    process.exit(1);
  }
}
