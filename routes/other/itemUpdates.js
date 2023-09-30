// Imports
import axios from 'axios';
import Collection from '../../models/Collection';
import Deck from '../../models/Deck';
import {
  saveNewChartData,
  getUserById,
  finalizeItemData,
  initializeVariables,
} from './chartDataLayer';

// Axios instance creation
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const updateSpecificItem = async (itemType, itemId) => {
  let item =
    itemType === 'Collection'
      ? await Collection.findById(itemId).populate('cards')
      : await Deck.findById(itemId).populate('cards');

  if (!item) throw new Error('Invalid item type.');

  const updatedTotalPrice = await updateCardsInItem(item);
  item.totalPrice = updatedTotalPrice;
  await item.save();

  return { itemId, updatedTotalPrice };
};

// updateAllItems: to update all items
async function updateAllItems(req, res) {
  try {
    // Fetch and update data logic here...
    // Use apiInstance to make HTTP requests to fetch new data
    // Update the ChartData model accordingly

    // For demonstration, suppose we're fetching some chart data
    const response = await instance.get('/path-to-data-endpoint');
    const data = response.data;

    console.log(data);
    res.status(200).json({ message: 'Items updated successfully.' });
  } catch (error) {
    console.error('Error updating items: ', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// Function to update items in a collection or deck
const updateItemsInCollection = async (collection) => {
  try {
    const updatedItems = await Promise.all(
      collection.items.map(async (item) => {
        const response = await instance.baseURL.get(`/cardinfo.php?id=${item._id}`);
        const updatedItemInfo = response.data.card_info;
        return {
          ...item,
          price: updatedItemInfo.price,
          updatedAt: new Date(),
        };
      }),
    );
    collection.items = updatedItems;
  } catch (error) {
    console.error(error);
    throw error; // Propagate error to be handled by the caller
  }
};

// saveNewChartData({
//   name: !ChartData.name ? `ChartData #${(await getUserById(userId)).allDataSets.length + 1}` : name,
//   userId: user._id,
//   data: {
//     allCollectionData,
//     allDeckData,
//     totalCollectionPrice,
//     totalDeckPrice,
//   },
// });

// Function to update collections
const updateCollections = async (user) => {
  try {
    if (!Array.isArray(user.collections)) return;

    await Promise.all(
      user.collections.map(async (collectionId) => {
        const collection = await Collection.findById(collectionId);
        if (!collection) return;

        await updateItemsInCollection(collection);
        await collection.save();

        console.log('collection', collection);
        const name = collection.name || `ChartData #${user.allDataSets.length + 1}`;
        await saveNewChartData(
          name,
          {
            x: collection.createdAt,
            y: collection.totalPrice,
          },
          user._id,
        );
      }),
    );
  } catch (error) {
    console.error(error);
    throw error; // Propagate error to be handled by the caller
  }
};

// Function to update cards in an item
const updateCardsInItem = async (item) => {
  try {
    const variables = await initializeVariables(item);
    // Assume updatePrices is an async function defined elsewhere
    // await updatePrices(item, variables.allItemPrices, ...);
    return await finalizeItemData(variables);
  } catch (error) {
    console.error(error);
    throw error; // Propagate error to be handled by the caller
  }
};

// Exports
export {
  updateItemsInCollection,
  updateCollections,
  updateCardsInItem,
  updateSpecificItem,
  updateAllItems,
};

// const updateCardsInItem = async (item) => {
//   try {
//     const {
//       itemType,
//       specificItemType,
//       collections,
//       decks,
//       allItems,
//       overallTotalPrice,
//       totalItemsInItemType,
//       allItemPrices,
//       totalPrice,
//       totalCollectionPrice,
//     } = await initializeVariables(item);

//     await updatePrices(item, allItemPrices, totalPrice, totalCollectionPrice);

//     return await finalizeItemData({
//       itemType,
//       specificItemType,
//       collections,
//       decks,
//       allItems,
//       overallTotalPrice,
//       totalItemsInItemType,
//       allItemPrices,
//       totalPrice,
//       totalCollectionPrice,
//     });
//   } catch (error) {
//     console.error(error);
//     throw error; // or handle the error as per your use case
//   }
// };
