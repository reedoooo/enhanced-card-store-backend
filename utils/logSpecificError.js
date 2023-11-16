const { createLogger, format, transports, error } = require('winston');
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message} `;
  if (metadata) {
    msg += JSON.stringify(metadata, null, 4);
  }
  return msg;
});

const logger = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [new transports.Console(), new transports.File({ filename: 'combined.log' })],
});

// Use this logger to log the error with detailed information
// logger.error('Update and sync failed', {
//   error: {
//     message: error.message,
//     stack: error.stack,
//     operationData: {
//       // Include any relevant data that could help in debugging
//       userId: params.userId,
//       collectionId: params.collectionId,
//       body: body,
//       attempt: attempt,
//     },
//   },
// });
