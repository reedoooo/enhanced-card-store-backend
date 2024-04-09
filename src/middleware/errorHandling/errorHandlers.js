/* eslint-disable no-unused-vars */
const logger = require('../../configs/winston');
/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/
// exports.catchErrors = (fn) => {
//   return function (req, res, next) {
//     const resp = fn(req, res, next);
//     if (resp instanceof Promise) {
//       return resp.catch((err) => {
//         logger.error(err.message, { stack: err.stack }); // Log the error
//         next(err);
//       });
//     }
//     return resp;
//   };
// };
/*
  Not Found Error Handler

  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
exports.notFound = (req, res, next) => {
  const error = new Error("Api url doesn't exist");
  logger.warn(
    `404 - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );
  res.status(404).json({
    success: false,
    message: error.message,
  });
};

/*
  Development Error Handler

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    { stack: err.stack },
  );
  res.status(err.status || 500).json({
    success: false,
    message: 'Oops! Error in Server',
    error: {
      message: err.message,
      error: err,
    },
  });
};

/*
  Production Error Handler

  No stacktraces are leaked to admin
*/
exports.productionErrors = (err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );
  res.status(500).json({
    success: false,
    message: 'Oops! Error in Server',
  });
};
