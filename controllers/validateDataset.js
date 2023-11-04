const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');

module.exports = function validateDataset(dataset) {
  if (!dataset) {
    logToAllSpecializedLoggers('Dataset validation failed: dataset is undefined or null', {
      section: 'error',
    });
    return false;
  }

  // Validate the 'name' field
  if (typeof dataset.name !== 'string' || dataset.name.trim() === '') {
    logToAllSpecializedLoggers('Dataset validation failed: name field is invalid', {
      section: 'error',
    });
    return false;
  }

  // Validate the 'data' field
  if (!Array.isArray(dataset.data)) {
    logToAllSpecializedLoggers('Dataset validation failed: data field is not an array', {
      section: 'error',
    });
    return false;
  }

  for (let item of dataset.data) {
    // Validate 'xys' array
    if (!Array.isArray(item.xys)) {
      logToAllSpecializedLoggers('Dataset validation failed: xys field is not an array', {
        section: 'error',
      });
      return false;
    }

    for (let xy of item.xys) {
      if (
        typeof xy.label !== 'string' ||
        typeof xy.data.x !== 'object' ||
        typeof xy.data.y !== 'number'
      ) {
        logToAllSpecializedLoggers(
          `Dataset validation failed: xys field has invalid structure for label ${xy.label}`,
          { section: 'error' },
        );
        return false;
      }
    }

    // Validate 'additionalPriceData' array
    if (!Array.isArray(item.additionalPriceData)) {
      logToAllSpecializedLoggers(
        'Dataset validation failed: additionalPriceData field is not an array',
        { section: 'error' },
      );
      return false;
    }

    for (let additionalData of item.additionalPriceData) {
      if (
        typeof additionalData.priceChanged !== 'boolean' ||
        typeof additionalData.initialPrice !== 'number' ||
        typeof additionalData.updatedPrice !== 'number' ||
        typeof additionalData.priceDifference !== 'number' ||
        typeof additionalData.priceChange !== 'number'
      ) {
        logToAllSpecializedLoggers(
          'Dataset validation failed: additionalPriceData field has invalid structure',
          { section: 'error' },
        );
        return false;
      }
    }
  }

  return true;
};
