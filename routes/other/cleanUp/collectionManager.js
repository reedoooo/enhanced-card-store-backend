// // Import necessary modules and methods
// const { getIO } = require('../../socket');
// const { Collection } = require('../../models/Collection');
// // const { updateAndSyncCollection } = require('../api/user');
// const { default: axios } = require('axios');

// // Set up an Axios instance for the ygoprodeck API
// const instance = axios.create({
//   baseURL: 'https://db.ygoprodeck.com/api/v7/',
// });

// // A function to update collections
// const updateCollections = async (user) => {
//   // Get the socket instance
//   const io = getIO();

//   try {
//     // If user doesn't have an 'allCollections' array, return early
//     if (!Array.isArray(user?.allCollections)) return;

//     // Loop through each collectionId in the user's 'allCollections' array
//     for (const collectionId of user.allCollections) {
//       // These console logs can be useful for debugging purposes
//       // console.log('Updating collection:', collectionId);
//       typeof collectionId === 'string' && console.log('collectionId is a string');
//       console.log('collectionId:', collectionId);

//       // Fetch the collection from the database by its ID
//       const collection = await Collection.findById(collectionId);
//       console.log('collection-------------------------->:', collection);

//       // Get the total price for all items in the collection (this uses another function defined below)
//       const totalPrice = await updateItemsInCollection(collection);

//       // Update the total price and the updated timestamp for the collection
//       collection.totalPrice = totalPrice;
//       collection.updatedAt = new Date();

//       // Send the update via socket to connected clients
//       io.emit('updateCollection', {
//         userId: user._id,
//         collectionId: collection?._id,
//         totalPrice,
//         updatedAt: collection?.updatedAt,
//       });
//     }
//   } catch (error) {
//     // Log any errors
//     console.error('Failed to update collections for user:', user._id, error.message);
//   }
// };

// // A function to update the items within a collection
// const updateItemsInCollection = async (collection) => {
//   try {
//     // Check if the collection and its items are valid
//     if (!collection || !Array.isArray(collection.items)) {
//       throw new Error('Invalid collection data');
//     }

//     console.log('Updating items in collection:', collection._id);
//     console.log('Collection items:', collection.items);
//     console.log('Collection items length:', collection);

//     const now = new Date();
//     const tenMinutes = 10 * 60 * 1000; // Calculate 10 minutes in milliseconds

//     // Loop through each item in the collection's items array
//     const updatedItems = await Promise.all(
//       collection?.items?.map(async (item, index) => {
//         const isOutdated = !item.updatedAt || now - item.updatedAt > tenMinutes;

//         // If the item's data is outdated, fetch new data from the API
//         if (isOutdated) {
//           const response = await instance.get(`/cardinfo.php?id=${item._id}`);
//           const updatedItemInfo = response?.data?.card_info;

//           console.log(`Successfully updated card at index ${index} with ID ${item._id}`);

//           // Return the updated item data
//           return {
//             ...item,
//             price: updatedItemInfo?.price,
//             updatedAt: new Date(),
//           };
//         } else {
//           // If the item's data is not outdated, log and return the original item
//           console.log(
//             `Skipped updating card at index ${index} with ID ${item._id} - recently updated`,
//           );
//           return item;
//         }
//       }),
//     );

//     // Update the collection's items array with the updated items
//     collection.items = updatedItems;
//   } catch (error) {
//     // Log any errors
//     console.error('Failed to update items in collection:', error.message);
//     throw error;
//   }
// };

// // Export the two functions so they can be used elsewhere
// module.exports = {
//   updateCollections,
//   updateItemsInCollection,
// };
