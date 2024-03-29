// const { populateUserDataByContext } = require('../controllers/User/dataUtils');

// /**
//  * Gets all collections for a user.
//  * @param {string} userId - The ID of the user
//  * @returns {Promise<Array>} A promise that resolves to an array of collections
//  */
// exports.getCollectionsForUser = async (userId) => {
//   try {
//     const populatedUser = await populateUserDataByContext(userId, ['collections']);
//     if (!populatedUser) {
//       console.error('User not found:', userId);
//       return null; // Return null to indicate no user found
//     }

//     // Assuming allCollections is the correct property name
//     return populatedUser.allCollections;
//   } catch (error) {
//     console.error('Error fetching collections for user:', userId, { error });
//     throw error; // Rethrow the error to handle it in the calling function
//   }
// };

// async function main() {
//   const userId = '65b8e155b4885b451a5071c8'; // Replace with the actual user ID

//   try {
//     const collections = await exports.getCollectionsForUser(userId);
//     console.log('COLLECTIONS IN CRONFETCH RETREIVED', collections);
//     if (collections && collections.length > 0) {
//       const totalPrice = collections.reduce((acc, collection) => {
//         // Ensure collection has a 'price' and it's a number
//         return acc + (Number.isFinite(collection.price) ? collection.price : 0);
//       }, 0);
//       const timestamp = new Date().toISOString();

//       console.log(
//         `Timestamp: ${timestamp}, Total Price of Collections for user ${userId}: ${totalPrice}`,
//       );
//     } else {
//       console.log(`No collections found for user: ${userId}`);
//     }
//   } catch (error) {
//     console.error('Error in processing collections for user:', userId, error);
//   }
// }

// main();
