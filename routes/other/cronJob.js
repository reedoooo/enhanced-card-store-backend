const User = require('../../models/User');
const { getIO } = require('../../socket');

const isValidObjectId = (id) => {
  const ObjectIdRegEx = /^[0-9a-fA-F]{24}$/;
  return ObjectIdRegEx.test(id);
};

const updateUserCollections = async (userId, pricingData) => {
  const io = getIO();

  if (!userId || typeof userId !== 'string') {
    throw new Error('UserId is missing, invalid, or not in the correct format.');
  }

  if (
    !pricingData ||
    typeof pricingData.updatedPrices !== 'object' ||
    Object.keys(pricingData.updatedPrices).length === 0
  ) {
    throw new Error('Invalid updatedPrices provided.');
  }

  if (
    !pricingData ||
    typeof pricingData.previousPrices !== 'object' ||
    Object.keys(pricingData.previousPrices).length === 0
  ) {
    throw new Error('Invalid previousPrices provided.');
  }

  try {
    const user = await User.findById(userId).populate('allCollections');
    if (!user) {
      throw new Error('User not found.');
    }

    const userCollections = user.allCollections;
    if (!userCollections || !Array.isArray(userCollections)) {
      throw new Error(
        'Failed to retrieve user collections or collections are not in the expected format.',
      );
    }

    for (const collection of userCollections) {
      if (!collection.cards || !Array.isArray(collection.cards)) {
        console.error('Invalid cards array in collection:', collection._id);
        continue;
      }

      collection.totalPrice = collection.cards.reduce(
        (acc, card) => acc + collection.allCardPrices,
        0,
      );
      collection.updatedAt = new Date();

      if (collection.totalPrice === 0 && typeof collection.totalCost === 'string') {
        collection.totalPrice = parseFloat(collection.totalCost);
      }

      for (const card of collection.cards) {
        if (card.id && pricingData.updatedPrices[card.id]) {
          card.price = pricingData.updatedPrices[card.id];
          // Add additional logic for updating chart_datasets if required
        } else if (!card.price) {
          console.error(`No price available for card ID: ${card.id}`);
          continue;
        }
      }

      // const oldTotalPrice = collection.totalPrice; // Store the old totalPrice for comparison

      // collection.totalPrice = collection.cards.reduce((acc, card) => acc + card.price, 0);
      collection.updatedAt = new Date();

      // Add logic for updating currentChartDatasets
      if (!collection.currentChartDatasets) {
        // Ensure to create an object which adheres to the new model format
        collection.currentChartDatasets = [
          {
            id: collection._id.toString(), // Assume the collection id is used here
            data: {
              x: collection.updatedAt,
              y: collection?.totalPrice === 0 ? collection?.totalCost : collection?.totalPrice,
            },
          },
        ];
      } else {
        // If currentChartDatasets already exist, find the dataset for the current collection using id
        const existingDataset = collection.currentChartDatasets.find(
          (ds) => ds.id === collection._id.toString(),
        );
        console.log('+++++++++++++++++++ExistingDataset:', existingDataset);
        console.log('+++++++++++++++++++Collection:', collection);
        console.log('+++++++++++++++++++Collection._id:', collection._id);
        console.log('+++++++++++++++++++Collection._id.toString():', collection.totalPrice);
        // If existing dataset is found, update the data for that dataset
        if (existingDataset) {
          existingDataset.data = {
            x: collection?.updatedAt,
            y: collection?.totalPrice,
          };
        }
        // If no existing dataset is found, add a new one
        else {
          collection.currentChartDatasets.push({
            id: collection._id.toString(),
            data: {
              x: collection.updatedAt,
              y: collection.totalPrice,
            },
          });
        }
      }

      await collection.save();

      console.log('Collection has been updated:', collection.name);
      // Emit the updated chart datasets to the clients
      io.emit('CHART_DATASETS_UPDATED', {
        message: 'Chart datasets have been updated',
        collectionId: collection._id,
        currentChartDatasets: collection.currentChartDatasets,
      });
    }

    await user.save();

    io.emit('COLLECTIONS_UPDATED', { message: 'Collections have been updated' });

    if (userCollections && userCollections.length > 0) {
      io.emit('RESPONSE_CRON_UPDATED_ALLCOLLECTIONS', {
        message: 'Cards have been updated',
        collections: userCollections,
      });
    }
  } catch (error) {
    console.error(error.message);
    throw new Error('Error updating user collections');
  }
};

module.exports = {
  updateUserCollections,
};
