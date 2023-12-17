const { loggers, logToSpecializedLogger } = require('../infoLogger');
let errors = [];

function logValidationError(message, dataset) {
  // logToAllSpecializedLoggers(message, { section: 'error' });

  logToSpecializedLogger(
    'error',
    // 'ERROR IN VALIDATEXY',
    `[L${errors.length - 1}--B][XY VALIDATION] ` + message,
    { section: 'errors', data: dataset },
    'log',
  );
}

module.exports.validateXY = function validateXY(xy) {
  const errors = [];

  // Validate 'label'
  if (typeof xy.label !== 'string') {
    errors.push('Invalid label: Expected a string.');
  }

  // Validate 'data'
  if (!xy.data || typeof xy.data !== 'object') {
    errors.push('Invalid data: Expected an object.');
  } else {
    // Validate 'data.x'
    const isValidDate = xy.data.x && !isNaN(Date.parse(xy.data.x));
    if (!isValidDate) {
      errors.push('Invalid data.x: Expected a valid date string.');
    }

    // Validate 'data.y'
    if (typeof xy.data.y !== 'number') {
      errors.push('Invalid data.y: Expected a number.');
    }
  }

  // Validate 'x' as a Date object
  if (!(xy.x instanceof Date)) {
    errors.push('Invalid x: Expected a Date object.');
  }

  // Validate 'y' as a number
  if (typeof xy.y !== 'number') {
    errors.push('Invalid y: Expected a number.');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// Example usage
// const incomingXY = {
//   label: 'Update Number 2',
//   data: { x: '2023-11-15 23:17', y: 20.790000000000003 },
//   x: new Date('2023-11-16T07:17:29.473Z'),
//   y: 0,
// };

// const validation = validateIncomingXY(incomingXY);
// if (!validation.isValid) {
//   console.log('Validation errors:', validation.errors);
// } else {
//   console.log('XY data is valid');
// }

// module.exports.validateXY = function validateXY(xyEntry) {
//   let errors = [];
//   logToAllSpecializedLoggers(
//     'info',
//     'XYS DATA IN VALIDATEXY',
//     { section: 'info', data: xyEntry },
//     'log',
//   );

//   if (!xyEntry) {
//     errors.push('XY validation failed: xy object is undefined or null');
//   } else {
//     // Validate the 'label' field
//     if (typeof xyEntry?.label !== 'string' || xyEntry?.label?.trim() === '') {
//       errors.push('XY validation failed: label field is invalid');
//     }

//     // Validate the 'x' and 'y' fields
//     if (!(xyEntry?.data?.x instanceof String) || typeof xyEntry?.data?.y !== 'number') {
//       // Check if x is a Date instance and y is a Number
//       errors.push('XY validation failed: x or y fields are invalid');
//     }
//   }

//   // if (errors.length > 0) {
//   //   errors.forEach((error) => {
//   //     logToAllSpecializedLoggers(
//   //       'error',
//   //       'ERROR IN VALIDATEXY',
//   //       { section: 'error', data: xys },
//   //       'log',
//   //     );
//   //     // logToAllSpecializedLoggers(error, { section: 'error' });
//   //   });
//   //   return false;
//   // }
//   if (errors.length > 0) {
//     errors.forEach(logValidationError);
//     return false;
//   }

//   return true;
// };
