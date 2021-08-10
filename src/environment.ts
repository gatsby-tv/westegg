import logger from "@src/logger";

const JWT_SECRET_REGEX =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\!\@\#\$\%\^\&\*\(\)\_\+])[0-9a-zA-Z\!\@\#\$\%\^\&\*\(\)\_\+\/\,\.\<\\\>\{\}\[\]\;\:\`\-\+\=]{64,}$/;
const IPFS_URL_REGEX =
  /^http(s)?:\/\/[a-zA-Z0-9\%\.\_\+\~\#\=]{1,256}\:[0-9]{1,5}([a-zA-Z0-9\(\)\@\:\%\_\+\.\~\#\?\&\/\=]*)$/;
const SENDGRID_API_KEY_REGEX = /^SG\..{1,256}$/;

const isDevelopment = !["staging", "production"].includes(process.env.NODE_ENV);

const required = {
  PUBLIC_URL: process.env.PUBLIC_URL,
  IPFS_URL: process.env.IPFS_URL,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
};

const secrets: Record<string, [string | undefined, RegExp]> = {
  JWT_SECRET: [process.env.JWT_SECRET, JWT_SECRET_REGEX]
};

if (!Object.values(required).every(Boolean)) {
  const variable = Object.entries(required).find(([key, value]) => !value)?.[0];
  throw new Error(`Missing environment variable: ${variable}`);
}

function validate() {
  const variable = Object.entries(secrets).find(
    ([key, [value, regex]]) => !regex.test(value as string)
  )?.[0];

  if (variable) {
    throw new Error(`Secret key is missing required complexity: ${variable}`);
  }
}

if (!isDevelopment) {
  try {
    validate();
  } catch (error) {
    logger.error(`Fatal: ${error}`);
    process.exit(1);
  }
} else {
  logger.warn("Do not run in production.");
}

process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
process.env.JWT_SECRET = process.env.JWT_SECRET
  ? Buffer.from(process.env.JWT_SECRET).toString("base64")
  : undefined;
