const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
let errors = [];

function logValidationError(message, dataset) {
  // logToAllSpecializedLoggers(message, { section: 'error' });

  logToAllSpecializedLoggers(
    'error',
    // 'ERROR IN VALIDATEXY',
    `[L${errors.length - 1}--B][XY VALIDATION] ` + message,
    { section: 'errors', data: dataset },
    'log',
  );
}

module.exports.validateXY = function validateXY(xys) {
  let errors = [];
  logToAllSpecializedLoggers(
    'info',
    'XYS DATA IN VALIDATEXY',
    { section: 'info', data: xys },
    'log',
  );

  if (!xys) {
    errors.push('XY validation failed: xy object is undefined or null');
  } else {
    // Validate the 'label' field
    if (typeof xys?.label !== 'string' || xys?.label?.trim() === '') {
      errors.push('XY validation failed: label field is invalid');
    }

    // Validate the 'x' and 'y' fields
    if (!(xys?.data?.x instanceof Date) || typeof xys?.data?.y !== 'number') {
      // Check if x is a Date instance and y is a Number
      errors.push('XY validation failed: x or y fields are invalid');
    }
  }

  // if (errors.length > 0) {
  //   errors.forEach((error) => {
  //     logToAllSpecializedLoggers(
  //       'error',
  //       'ERROR IN VALIDATEXY',
  //       { section: 'error', data: xys },
  //       'log',
  //     );
  //     // logToAllSpecializedLoggers(error, { section: 'error' });
  //   });
  //   return false;
  // }
  if (errors.length > 0) {
    errors.forEach(logValidationError);
    return false;
  }

  return true;
};
