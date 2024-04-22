const morgan = require("morgan");
require("colors");

// morgan.token("coloredMethod", (req) => req.method.yellow);
morgan.token("coloredMethod", (req) => `[${req.method.yellow}]`);
morgan.token("coloredStatus", (req, res) => {
  const status = res.statusCode;
  const returnedStatus = status >= 400? status.toString().red : status.toString().green;
  return `[${returnedStatus}]`
});
const morganMiddleware = morgan(
  (tokens, req, res) => {
    // Use the custom token 'methodWithUrl' to format the log message
    return `${tokens.coloredMethod(req)} ${tokens.url(req, res)} ${tokens.coloredStatus(req, res)} ${tokens.res(req, res, "content-length")}`;
  }
);

module.exports = {
  morganMiddleware,
};
