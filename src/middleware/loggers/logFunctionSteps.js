const logFunctionSteps = (stepNumber, description) => {
	console.log('------------------------'.green);
	console.log(`Step ${stepNumber}: ${description}`);
  console.log('------------------------'.green);
};

module.exports = {
  logFunctionSteps,
};