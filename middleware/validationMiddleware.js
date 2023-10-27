// const { check } = require('express-validator');

// const commonChecks = [
//   check('name', 'Name is required').exists(),
//   check('description', 'Description is required').exists(),
// ];

// exports.validate = (method) => {
//   switch (method) {
//     case 'createNewCollection': {
//       return [
//         check('name', 'Name is required').exists(),
//         check('description', 'Description is required').exists(),
//         check('items', 'Items is required').exists(),
//         check('items', 'Items must be an array').isArray(),
//         // ... other checks
//       ];
//     }
//     case 'getAllCollectionsForUser': {
//       return [
//         check('name', 'Name is required').exists(),
//         check('description', 'Description is required').exists(),
//         check('items', 'Items is required').exists(),
//         check('items', 'Items must be an array').isArray(),
//         // ... other checks
//       ];
//     }
//     case 'updateAndSyncCollection': {
//       return [
//         check('name', 'Name is required').exists(),
//         check('description', 'Description is required').exists(),
//         check('items', 'Items is required').exists(),
//         check('items', 'Items must be an array').isArray(),
//         // ... other checks
//       ];
//     }
//     case 'createNewDeck': {
//       return [
//         check('name', 'Name is required').exists(),
//         check('description', 'Description is required').exists(),
//         check('cards', 'Cards is required').exists(),
//         check('cards', 'Cards must be an array').isArray(),
//         // ... other checks
//       ];
//     }
//     // ... other cases
//   }
// };
