const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
require('colors');
let errors = [];

// Helper function to log errors
function logValidationError(message, dataset) {
  // logToAllSpecializedLoggers(message, { section: 'error' });

  logToAllSpecializedLoggers(
    'error',
    // 'ERROR IN VALIDATEXY',
    `[L${errors?.length - 1}][DATASET VALIDATION] ` + message,
    { section: 'errors', data: dataset },
    'log',
  );
}

module.exports.validateDataset = function validateDataset(existingCollection, dataset) {
  if (!dataset) {
    logValidationError('[L1] Dataset validation failed: dataset is undefined or null', dataset);
    return false;
  }

  // Validate the 'name' field
  if (typeof existingCollection.name !== 'string' || existingCollection.name.trim() === '') {
    errors.push('Collection name missing, received: ', existingCollection.name);
  }

  // Validate the 'data' array structure according to DatasetSchema
  if (!Array.isArray(dataset.data)) {
    errors.push('data field is not an array');
  } else {
    dataset.data.forEach((dataItem, dataIndex) => {
      // Validate the 'xys' array structure according to DatasetSchema
      if (!Array.isArray(dataItem.xys)) {
        errors.push(`data[${dataIndex}].xys field is not an array`);
      } else {
        dataItem?.xys.forEach((xy, xyIndex) => {
          // const datasetMessage = `[DATASET VALIDATION][TYPE CHECK][${xy}]--> ${typeof xy} | [${
          //   xy.label
          // }]--> ${typeof xy.label} | [${xy.x}]--> ${typeof xy.x} | [${xy.y}]--> ${typeof xy.y}`;

          const isDateOrString =
            xy?.x instanceof Date || (typeof xy?.x === 'string' && !isNaN(Date.parse(xy?.x)));

          // if (typeof xy?.label !== 'string' || !isDateOrString || typeof xy?.y !== 'number') {
          if (typeof xy?.label !== 'string') {
            const datasetMessage =
              `Data[${dataIndex}].xys[${xyIndex}] has invalid structure: ` +
              `label type (${typeof xy?.label}), y type (${typeof xy?.y})`;

            // const datasetMessage = `[DATASET VALIDATION][TYPE CHECK][${xy}]--> ${typeof xy} | [${
            //   xy?.label
            // }]--> ${typeof xy?.label} | [${xy?.x}]--> ${typeof xy?.x} | [${
            //   xy?.y
            // }]--> ${typeof xy?.y}`;

            logToAllSpecializedLoggers(
              'info',
              datasetMessage,
              { section: 'info', data: dataItem },
              'log',
            );
            errors.push(datasetMessage);
            // errors.push(`data[${dataIndex}].xys[${xyIndex}] has invalid structure`);
            logValidationError(
              `Dataset validation failed: xy at index ${xyIndex} has invalid structure.`,
              xy,
            );
          }
        });
      }
    });
  }

  // if (errors.length > 0) {
  //   errors.forEach(logValidationError);
  //   return false;
  // }
  if (errors.length > 0) {
    errors.forEach((error) => logValidationError(error, dataset));
    return false;
  }
  return true;
};
