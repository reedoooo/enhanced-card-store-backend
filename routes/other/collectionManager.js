const { getIO } = require('../../socket');
const { Collection } = require('../../models/Collection');
const { default: axios } = require('axios');
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
const updateCollections = async (user) => {
  const io = getIO();

  try {
    if (!Array.isArray(user?.allCollections)) return;

    for (const collectionId of user.allCollections) {
      // console.log('Updating collection:', collectionId);
      typeof collectionId === 'string' && console.log('collectionId is a string');
      const collection = await Collection.findById(collectionId);
      const totalPrice = await updateItemsInCollection(collection);
      collection.totalPrice = totalPrice;
      collection.updatedAt = new Date();
      await collection.save();

      io.emit('updateCollection', {
        userId: user._id,
        collectionId: collection?._id,
        totalPrice,
        updatedAt: collection?.updatedAt,
      });
    }
  } catch (error) {
    console.error('Failed to update collections for user:', user._id, error.message);
  }
};

const updateItemsInCollection = async (collection) => {
  try {
    if (!collection || !Array.isArray(collection.items)) {
      throw new Error('Invalid collection data');
    }

    const now = new Date();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

    const updatedItems = await Promise.all(
      collection.items.map(async (item, index) => {
        // Note the `index` parameter
        const isOutdated = !item.updatedAt || now - item.updatedAt > tenMinutes;

        if (isOutdated) {
          const response = await instance.get(`/cardinfo.php?id=${item._id}`);
          const updatedItemInfo = response?.data?.card_info;

          // Log successful update and card index
          console.log(`Successfully updated card at index ${index} with ID ${item._id}`);

          return {
            ...item,
            price: updatedItemInfo?.price,
            updatedAt: new Date(),
          };
        } else {
          // Log that the card was not updated due to recent update
          console.log(
            `Skipped updating card at index ${index} with ID ${item._id} - recently updated`,
          );

          return item;
        }
      }),
    );

    collection.items = updatedItems;
  } catch (error) {
    console.error('Failed to update items in collection:', error.message);
    throw error;
  }
};

module.exports = {
  updateCollections,
  updateItemsInCollection,
};
