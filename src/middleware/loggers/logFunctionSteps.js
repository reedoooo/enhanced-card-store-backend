const logger = require("../../configs/winston");

const logFunctionSteps = (stepNumber, description) => {
	logger.info('------------------------'.green);
	logger.info(`Step ${stepNumber}: ${description}`);
  logger.info('------------------------'.green);
};

module.exports = {
  logFunctionSteps,
};