import * as winston from "winston";

const colorizer = winston.format.colorize();

export const logger = winston.createLogger({
  level: process.env.LOGGING_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) =>
      colorizer.colorize(
        info.level,
        `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`
      )
    )
  ),
  transports: [new winston.transports.Console()]
});
