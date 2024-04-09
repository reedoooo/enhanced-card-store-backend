// // src/middleware/logRequests.js
const logger = require("../../configs/winston");

const infoLogger = (message, data) => {
	logger.info("[INFO] ".blue + message, data);
};

module.exports = {
  infoLogger,
};

// const logInfo = () => {
// 	logger.ingo("[INFO] ".blue + req.method + " " + req.originalUrl);
//   res.status(err.status || 500);
//   res.json({
//     message: err.message,
//     error: process.env.NODE_ENV === "production"? {} : err.stack,
//   });
// };

// module.exports = { logInfo };

