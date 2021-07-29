import * as winston from "winston";

function capitalize(message: string): string {
  return message
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

const { colorize } = winston.format.colorize();

const logger = winston.createLogger({
  level: process.env.LOGGING_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) =>
      colorize(
        info.level,
        `${info.timestamp} [${capitalize(process.env.NODE_ENV)}] ${capitalize(
          info.level
        )}: ${info.message}${info.stack ?? ""}`
      )
    )
  ),
  transports: [new winston.transports.Console()]
});

export default logger;
