const winston = require("winston");
require("winston-daily-rotate-file");
const { createLogger, format, transports } = winston;
const { logRequests } = require("../configs/winston");

const logsDir = "./logs";
const defaultLogLevel = process.env.LOG_LEVEL || "error";

// Custom format for console logs
const consoleFormat = format.combine(
  format.timestamp(),
  format.printf(({ level, message, timestamp, meta }) => {
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (meta) {
      formattedMessage += ` | ${JSON.stringify(meta)}`;
    }
    return formattedMessage;
  })
);

// Transport for file logs
const fileTransport = (label) =>
  new transports.DailyRotateFile({
    filename: `${logsDir}/${label}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: format.combine(format.timestamp(), format.json()),
  });

// Create logger with console and file transports
const createLoggerWithTransports = (label, level = defaultLogLevel) =>
  createLogger({
    level,
    transports: [
      new transports.Console({ format: consoleFormat }),
      fileTransport(label),
    ],
  });

// Initialize specialized loggers
const sections = [
  "collection",
  "cardPrice",
  "cronjob",
  "error",
  "warn",
  "info",
  "end",
  "start",
];
const specializedLoggers = sections.reduce((acc, section) => {
  acc[section] = createLoggerWithTransports(section);
  return acc;
}, {});

// Log to specialized loggers
function logToSpecializedLogger(level, message, meta) {
  const logger =
    specializedLoggers[meta?.section] ||
    createLoggerWithTransports(meta?.section);
  logger.log({ level, message, ...meta });

  if (meta.error instanceof Error) {
    const errorInfo = {
      message: meta.error.message,
      stack: meta.error.stack,
      code: meta.error.code,
      status: meta.error.status,
    };
    logger.error(errorInfo);
  }
}

// Helper function to respond to client
function respondToClient(res, status, message, data = {}) {
  if (res.headersSent) return;
  res.status(status).json({ message, data });
}

module.exports = {
  loggers: specializedLoggers,
  logToSpecializedLogger,
  respondToClient,
};
