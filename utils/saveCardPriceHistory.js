const Collection = require('../models/Collection'); // replace with the actual path to your Collection model

/**
 * Save the updated price history for a card within a collection.
 * @param {mongoose.Types.ObjectId} userId - The ID of the user.
 * @param {string} cardId - The ID of the card to update.
 * @param {Object} priceHistory - The new price entry object to be added to the price history.
 * @returns {Promise<Collection>} The updated collection document.
 */
async function saveCardPriceHistory(userId, cardId, priceHistory) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a string.');
    }
    if (typeof cardId !== 'string') {
      throw new Error('cardId must be a string.');
    }
    if (
      !priceHistory ||
      typeof priceHistory.price !== 'number' ||
      !priceHistory.timestamp ||
      new Date(priceHistory.timestamp).toString() === 'Invalid Date'
    ) {
      throw new Error('priceHistory is not properly formatted.');
    }
    // Find the collection that contains the card and update its price history array
    const updatedCollection = await Collection.findOneAndUpdate(
      { 'cards.id': cardId, userId: userId },
      {
        // Push the new price entry into the price history array for the specific card
        $push: { 'cards.$.priceHistory': priceHistory },
      },
      {
        new: true, // Return the modified document rather than the original
        runValidators: true, // Ensure the update honors schema validations
      },
    );

    // If the collection with the card is not found, throw an error
    if (!updatedCollection) {
      throw new Error(
        `Collection containing card with ID ${cardId} for user with ID ${userId} not found.`,
      );
    }

    return updatedCollection;
  } catch (error) {
    console.error(`Error updating price history for card with ID ${cardId}:`, error);
    throw error; // Re-throw the error for the caller to handle
  }
}

module.exports = saveCardPriceHistory; // Export the function to use in other parts of your application
