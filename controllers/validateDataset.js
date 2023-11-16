const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
require('colors');

// Constants for error types
const ERROR_TYPES = {
  UNDEFINED_DATASET: 'Undefined or null dataset',
  INVALID_COLLECTION_NAME: 'Invalid collection name',
  NON_ARRAY_DATA: 'Data field is not an array',
  INVALID_XY_STRUCTURE: 'Invalid XY structure',
  MISMATCHED_DATA_LENGTH: 'Mismatched data array length',
  INVALID_COLLECTION_STRUCTURE: 'Invalid existing collection structure',
  VERSION_ERROR: 'Version error - no matching document found',
};

// Function to log validation errors
function logValidationError(error, errorIndex) {
  const errorMessage = `[${errorIndex}][DATASET VALIDATION] `.red + `${error.message}`.white;
  logToAllSpecializedLoggers('error', errorMessage, { section: 'errors', data: error.data }, 'log');
  console.error(errorMessage, error.data);
}

// Function to validate the XYs structure within dataItem
// function validateXys(dataItem, dataIndex) {
//   const errors = [];
//   if (!Array.isArray(dataItem.xys)) {
//     errors.push({
//       message: `data[${dataIndex}].xys field is not an array`,
//       data: dataItem,
//     });
//   } else {
//     dataItem.xys.forEach((xy, xyIndex) => {
//       if (!isValidXyStructure(xy)) {
//         errors.push({
//           message: `Data[${dataIndex}].xys[${xyIndex}] has invalid structure`,
//           data: xy,
//         });
//       }
//     });
//   }
//   return errors;
// }

// Helper function to check for version errors
function hasVersionError(err) {
  return err.name === 'VersionError';
}

module.exports.validateDataset = function validateDataset(
  existingCollection,
  dataset,
  errorFromDB,
) {
  let errors = [];

  // Check for undefined dataset or collection
  if (!dataset || !existingCollection) {
    errors.push({
      message: ERROR_TYPES.UNDEFINED_DATASET,
      data: dataset || existingCollection,
    });
    return false;
  }

  // Validate collection name
  if (!existingCollection.name || typeof existingCollection.name !== 'string') {
    existingCollection.name = `Collection ${existingCollection._id}`;
  }

  // Handle version errors from the database
  if (errorFromDB && hasVersionError(errorFromDB)) {
    errors.push({
      message: ERROR_TYPES.VERSION_ERROR,
      data: { id: errorFromDB.value, error: errorFromDB.message },
    });
    logValidationError(errors[0], 0);
    return false;
  }

  // Validate chartData structure in collection
  if (!existingCollection.chartData || !Array.isArray(existingCollection.chartData.datasets)) {
    errors.push({
      message: ERROR_TYPES.INVALID_COLLECTION_STRUCTURE,
      data: existingCollection,
    });
  }

  // Validate dataset structure
  if (!Array.isArray(dataset.data)) {
    errors.push({
      message: ERROR_TYPES.NON_ARRAY_DATA,
      data: dataset,
    });
  } else {
    // Filter out empty data arrays in datasets
    let filteredDatasets = existingCollection.chartData.datasets.filter((ds) => ds.data.length > 0);

    // Check for mismatched data array length
    if (filteredDatasets.length > 0 && filteredDatasets[0].data.length !== dataset.data.length) {
      errors.push({
        message: ERROR_TYPES.MISMATCHED_DATA_LENGTH,
        data: {
          expectedLength: filteredDatasets[0].data.length,
          receivedLength: dataset.data.length,
          datasets: filteredDatasets,
        },
      });
    } else {
      // Validate XY structures within dataset data
      dataset.data.forEach((dataItem, dataIndex) => {
        errors.push(...validateXys(dataItem, dataIndex));
      });
    }
  }

  // Log and return validation errors
  if (errors.length > 0) {
    errors.forEach((error, index) => logValidationError(error, index));
    return false;
  }

  return true;
};

// Helper function to validate each XY structure
function validateXys(dataItem, dataIndex) {
  const errors = [];
  if (!Array.isArray(dataItem.xys)) {
    errors.push({
      message: `Data[${dataIndex}] xys is not an array`,
      data: dataItem,
    });
  } else {
    dataItem.xys.forEach((xy, xyIndex) => {
      if (!isValidXyStructure(xy)) {
        errors.push({
          message: `Data[${dataIndex}].xys[${xyIndex}] has invalid structure`,
          data: xy,
        });
      }
    });
  }
  return errors;
}

// Define isValidXyStructure based on your criteria
function isValidXyStructure(xy) {
  // Initialize an array to store error messages
  let errorMessages = [];

  // Default values for x and y if they're undefined or missing
  if (xy.x === undefined || xy.x === null) {
    xy.x = new Date(); // Set 'x' to current date/time
  }

  if (xy.y === undefined || xy.y === null) {
    xy.y = 0; // Set 'y' to 0
  }

  // Check if the 'label' property exists and is a string
  if (typeof xy.label !== 'string') {
    errorMessages.push(`Invalid 'label' property type: ${typeof xy.label}. Expected a string.`);
  }

  // Check if the 'x' property is a valid date or a string that can be parsed into a date
  const isDateOrString =
    xy.x instanceof Date || (typeof xy.x === 'string' && !isNaN(Date.parse(xy.x)));
  if (!isDateOrString) {
    errorMessages.push(
      `Invalid 'x' property value: ${xy.x}. Expected a Date instance or a string representing a date.`,
    );
  }

  // Check if the 'y' property exists and is a number
  if (typeof xy.y !== 'number') {
    errorMessages.push(`Invalid 'y' property type: ${typeof xy.y}. Expected a number.`);
  }

  // If there are error messages, log them and return false
  if (errorMessages.length > 0) {
    console.error('XY structure validation errors:', errorMessages);
    return false;
  }

  // If no errors were found, return true
  return true;
}

// Main validation function for datasets
// module.exports.validateDataset = function validateDataset(
//   existingCollection,
//   dataset,
//   errorFromDB,
// ) {
//   let errors = [];
//   if (!existingCollection) {
//     errors.push({
//       message: ERROR_TYPES.UNDEFINED_DATASET,
//       data: existingCollection,
//     });
//   }
//   if (!existingCollection.name) {
//     existingCollection.name = `Collection ${existingCollection._id}`;
//   }

//   if (errorFromDB && hasVersionError(errorFromDB)) {
//     errors.push({
//       message: ERROR_TYPES.VERSION_ERROR,
//       data: { id: errorFromDB.value, error: errorFromDB.message },
//     });
//     logValidationError(errors[0], 0);
//     return false; // Stop further validation as there is a version error
//   }

//   if (!dataset) {
//     errors.push({
//       message: ERROR_TYPES.UNDEFINED_DATASET,
//       data: dataset,
//     });
//   } else {
//     if (typeof existingCollection.name !== 'string' || existingCollection.name.trim() === '') {
//       errors.push({
//         message: ERROR_TYPES.INVALID_COLLECTION_NAME,
//         data: existingCollection,
//       });
//     }

//     if (!existingCollection.chartData || !Array.isArray(existingCollection.chartData.datasets)) {
//       errors.push({
//         message: ERROR_TYPES.INVALID_COLLECTION_STRUCTURE,
//         data: existingCollection,
//       });
//     }

//     // Check if dataset.data is not an array, attempt to retrieve by _id if possible
//     if (!Array.isArray(dataset.data)) {
//       // Add error for non-array data
//       errors.push({
//         message: ERROR_TYPES.NON_ARRAY_DATA + `: ${typeof dataset.data}`,
//         data: dataset,
//       });
//       // Attempt to retrieve the dataset from the existing collection by _id
//       const retrievedDataset = existingCollection.chartData.datasets.find(
//         (ds) => ds._id === dataset._id,
//       );
//       // If a dataset with the provided _id exists within the collection, use its data
//       if (retrievedDataset) {
//         dataset.data = retrievedDataset.data;
//       }
//     } else {
//       if (
//         existingCollection.chartData.datasets.some((ds) => ds.data.length !== dataset.data.length)
//       ) {
//         errors.push({
//           message: ERROR_TYPES.MISMATCHED_DATA_LENGTH,
//           data: dataset,
//         });
//       } else {
//         dataset.data.forEach((dataItem, dataIndex) => {
//           errors.push(...validateXys(dataItem, dataIndex));
//         });
//       }
//     }
//   }

//   if (errors.length > 0) {
//     errors.forEach((error, index) => logValidationError(error, index));
//   }

//   return errors.length === 0;
// };
