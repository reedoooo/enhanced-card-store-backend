const { CardInCollection } = require("../src/models/Card");
const User = require("../src/models/User");
const { getCardInfo, calculateCollectionValue } = require("../src/utils/utils");

const checkAndUpdateCardPrices = async (userId, selectedList, io) => {
  try {
    let priceUpdates = [];

    for (const card of selectedList) {
      const latestCardInfo = await getCardInfo(card.id);
      const latestPrice = parseFloat(
        latestCardInfo.card_prices[0]?.tcgplayer_price || 0
      );

      if (latestPrice !== card.latestPrice.num) {
        logPriceChange("CHANGE", card, latestPrice, card.latestPrice.num);

        priceUpdates.push({
          _id: card._id,
          cardId: card.id,
          oldPrice: card.latestPrice.num,
          newPrice: latestPrice,
          newTotalPrice: latestPrice * card.quantity,
          newChartDatasets: [
            ...card.chart_datasets,
            { x: new Date(), y: latestPrice * card.quantity },
          ],
          newLastSavedPrice: {
            num: latestPrice,
            timestamp: new Date(),
          },
          newLatestPrice: {
            num: latestPrice,
            timestamp: new Date(),
          },
          // newDataOfLastPriceUpdate: new Date(),
          newPriceHistory: [
            ...card.priceHistory,
            {
              num: latestPrice,
              timestamp: new Date(),
            },
          ],
          newTag: "unsaved", // Marking the card as 'unsaved' due to the price change
        });
      } else {
        logPriceChange("NO_CHANGE", card, latestPrice, card.latestPrice.num);
      }
    }

    if (priceUpdates?.length > 10) {
      await updateCollectionsWithNewCardValues(userId, priceUpdates, io); // Assuming this function handles the update of card data including the 'tag' field
    } else {
      console.log("NO_CARD_PRICE_CHANGE");
      io.emit("CARD_PRICES_UNCHANGED", {
        message: "Card prices remain unchanged",
        currentPrices: selectedList,
      });
    }
    return priceUpdates;
  } catch (error) {
    console.error("Error in checkAndUpdateCardPrices:", error);
    logError(error, error.message, null, {
      source: "checkAndUpdateCardPrices",
    });
    throw error;
  }
};

const updateCollectionsWithNewCardValues = async (userId, priceUpdates, io) => {
  try {
    let user = await User.findById(userId).populate({
      path: "allCollections",
      populate: { path: "cards" },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update CardInCollection recordsk
    for (const update of priceUpdates) {
      // console.log('update', update);
      await CardInCollection.findOneAndUpdate(
        { _id: update._id },
        {
          latestPrice: update.newLatestPrice,
          lastSavedPrice: update.newLastSavedPrice,
          priceHistory: update.newPriceHistory,
          chart_datasets: update.newChartData,
          price: update.newPrice,
          totalPrice: update.newTotalPrice,
          tag: update.newTag,
          dataOfLastPriceUpdate: new Date(
            update.newLastSavedPrice.timestamp ||
              update.newLatestPrice.timestamp
          ),
        }
      );
    }

    // Repopulate the user's allCollections and their cards
    user = await User.findById(userId).populate({
      path: "allCollections",
      populate: { path: "cards" },
    });

    // Update user's allCollections.cards and calculate new collection values
    for (const collection of user.allCollections) {
      let newTotalPrice = calculateCollectionValue(collection.cards);
      let newChartData = {
        allXYValues: [
          ...collection.chartData.allXYValues,
          {
            label: `Autonomous Update ${new Date()}`,
            x: new Date(),
            y: newTotalPrice,
          },
        ],
      };
      let collectionPriceHistory = [
        ...collection.collectionPriceHistory,
      ];
      for (const card of collection.cards) {
        const update = priceUpdates.find(
          (u) => u.cardId === card._id.toString()
        );
        if (update) {
          Object.assign(card, update);
          newTotalPrice += update.newTotalPrice;
          newChartData.allXYValues.push({
            label: `Autonomous Update ${new Date()}`,
            x: new Date(),
            y: newTotalPrice,
          });
        }
      }

      collection.totalPrice = newTotalPrice;
      collection.collectionPriceHistory.push({
        num: newTotalPrice,
        timestamp: new Date().toISOString(),
      });
      // collection.dailyCollectionPriceHistory.push({
      //   num: newTotalPrice,
      //   timestamp: new Date().toISOString(),
      // });
      collection.chartData.allXYValues = newChartData.allXYValues;
      collection.collectionPriceHistory = collectionPriceHistory;

      await collection.save(); // Save updates to each collection
    }

    await user.save(); // Save updates to user

    // Repopulate the user's allCollections and their cards (again)
    user = await User.findById(userId).populate({
      path: "allCollections",
      populate: { path: "cards" },
    });

    // Emit updated data
    io.emit("COLLECTIONS_UPDATED", {
      message: "All collections updated successfully",
      updatedCards: user.allCollections.flatMap((collection) =>
        collection.cards.map((card) => card.toObject())
      ),
      allCollections: user.allCollections.map((collection) =>
        collection.toObject()
      ),
    });
  } catch (error) {
    console.error("Error in updateCollectionsWithNewCardValues:", error);
    logError(error, error.message, null, {
      data: priceUpdates,
      source: "updateCollectionsWithNewCardValues",
    });
    throw error;
  }
};

module.exports = {
  updateCollectionsWithNewCardValues,
  checkAndUpdateCardPrices,
};
