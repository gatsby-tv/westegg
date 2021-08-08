import * as winston from "winston";

const { colorize } = winston.format.colorize();

const logger = winston.createLogger({
  level: process.env.LOGGING_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) =>
      colorize(
        info.level,
        `${info.timestamp} [${
          process.env.NODE_ENV ?? "development"
        }] ${info.level.toUpperCase()}: ${info.message}${info.stack ?? ""}`
      )
    )
  ),
  transports: [new winston.transports.Console()]
});

export default logger;
