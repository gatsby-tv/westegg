import { logger } from "./logger";

export enum Environment {
  DEV = "dev",
  STAGING = "staging",
  PRODUCTION = "production"
}

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

    // TODO: Validate prod JWT secret key is strong

    // TODO: Validate mongo url variables

    // TODO: Validate IPFS url format
  } catch (error) {
    logger.error(`FATAL: ${error}`);
    process.exit(1);
  }
}
