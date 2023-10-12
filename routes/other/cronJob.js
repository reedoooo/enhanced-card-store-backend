const { Collection } = require('../../models/Collection');
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
    // Get the user's collections.
    if (!userId) {
      throw new Error('User ID is missing.');
    }
    const user = await User.findById(userId).populate('allCollections');
    if (!user) {
      throw new Error('User not found.');
    }

    const userCollections = user.allCollections;
    // Get the user's collections.
    // const userCollections = await Collection.find({ userId: userId }).populate('cards');
    console.log('userCollections:', userCollections);
    // const userCollections = await User.find({ userId: userId });
    if (!userCollections || !Array.isArray(userCollections)) {
      throw new Error(
        'Failed to retrieve user collections or collections are not in the expected format.',
      );
    }

    // Iterate over each collection and update the cards if the prices have shifted.
    for (const collection of userCollections) {
      if (!collection.cards || !Array.isArray(collection.cards)) {
        console.error('Invalid cards array in collection:', collection._id);
        continue;
      }

      for (const card of collection.cards) {
        if (card.id && pricingData.updatedPrices[card.id]) {
          card.price = pricingData.updatedPrices[card.id]; // Update the card price to the new one
        } else if (!card.price) {
          // If there's no updated price and the card doesn't have an existing price,
          // handle the case, e.g., skip updating this card, set a default price, or handle in some other manner
          console.error(`No price available for card ID: ${card.id}`);
          continue; // This will skip updating this card in the current loop iteration
        }
      }

      // Update the collection's totalPrice
      collection.totalPrice = collection.cards.reduce((acc, card) => acc + card.price, 0);
      // Update the collection's updatedAt timestamp
      collection.updatedAt = new Date();

      // Save the collection
      await collection.save();

      console.log('Collection has been updated:', collection);
    }

    // Save the user
    await user.save();

    // console.log('Collections have been updated');
    // console.log('userCollections:', userCollections);
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
