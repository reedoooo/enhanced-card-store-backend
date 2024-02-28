// const mongoose = require('mongoose');
// // const Collection = require('./path-to-collection-model'); // Replace with your model's actual path

// function validateCollectionUpdate(updatedData, originalData) {
//   const validationResults = [];

//   // Utility to add validation result
//   const addValidationResult = (field, original, updated, isValid) => {
//     validationResults.push({ field, original, updated, isValid });
//   };

//   // Recursively validate nested objects
//   const validateObject = (originalObj, updatedObj, parentKey = '') => {
//     Object.keys(originalObj).forEach((key) => {
//       const fullKey = parentKey ? `${parentKey}.${key}` : key;
//       if (typeof originalObj[key] === 'object' && !Array.isArray(originalObj[key])) {
//         // Nested object
//         validateObject(originalObj[key], updatedObj[key], fullKey);
//       } else {
//         // Primitive or array
//         const isValid = JSON.stringify(originalObj[key]) === JSON.stringify(updatedObj[key]);
//         addValidationResult(fullKey, originalObj[key], updatedObj[key], isValid);
//       }
//     });
//   };

//   // Run validation
//   validateObject(originalData, updatedData);

//   // Log results in a table format
//   console.table(validationResults);
// }

// module.exports = validateCollectionUpdate;
