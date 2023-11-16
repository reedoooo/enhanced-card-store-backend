const axios = require('axios');
const colors = require('colors'); // for colorizing logs
const fs = require('fs');

const CustomError = require('../middleware/customError');
const SimulatedCard = require('../models/SimulatedCard');
const MonitoredCard = require('../models/MonitoredCard');
const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const { logData } = require('./logPriceChanges');

const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

async function getRandomCardInfo() {
  try {
    const response = await axiosInstance.get('/randomcard.php');

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error fetching random card:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received for random card:', error.request);
    } else {
      console.error('Error setting up request for random card:', error.message);
    }
    throw new CustomError(
      'Failed to get random card information',
      { error: error.toString() },
      500,
      true,
    );
  }
}

const getCardInfo = async (cardId) => {
  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return data.data[0];
  } catch (error) {
    console.error(`Error fetching card info for card ID ${cardId}:`, error);
    throw error;
  }
};

// Process Monitored Cards
const trackCardPrices = async (monitoredCards, listOfSimulatedCards) => {
  monitoredCards = Array.isArray(monitoredCards) ? monitoredCards : [];
  listOfSimulatedCards = Array.isArray(listOfSimulatedCards) ? listOfSimulatedCards : [];
  let updates = [];

  // logToAllSpecializedLoggers('info', '[1] CP 1 reached: trackCardPrices', {
  //   section: 'cronjob',
  //   action: 'log',
  //   data: { monitoredCards, listOfSimulatedCards },
  // });
  for (const cardData of monitoredCards) {
    try {
      let card = await MonitoredCard.findOne({ id: cardData.id });
      const now = new Date();
      let newLatestPrice = 0;
      let quantity = cardData.quantity || 0; // Default to 0 if quantity is not provided

      if (card) {
        const latestCardInfo = await getCardInfo(card.id);
        newLatestPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0);
      } else {
        newLatestPrice = parseFloat(cardData?.latestPrice.num || 0);
      }

      if (isNaN(newLatestPrice)) {
        console.error(`Invalid price for card ID ${cardData.id}: ${newLatestPrice}`);
        continue;
      }

      if (!card) {
        card = new MonitoredCard({
          id: cardData.id,
          name: cardData.name,
          tag: 'monitored',
          latestPrice: { num: newLatestPrice, timestamp: now },
          lastSavedPrice: { num: newLatestPrice, timestamp: now },
          priceHistory: [{ num: newLatestPrice, timestamp: now }],
          quantity: quantity,
        });
        await card.save();
      } else {
        await updateMonitoredCard(card, newLatestPrice, quantity, now); // Pass quantity to the update function
      }

      logPriceChange(
        card,
        { latestPrice: card.latestPrice, lastSavedPrice: card.lastSavedPrice, priceDifference: 0 },
        !card,
      );
      updates.push(card);
    } catch (error) {
      console.error(`Error processing monitored card (ID: ${cardData.id}):`, error);
    }
  }

  const simulatedCardCount = await SimulatedCard.countDocuments();
  console.log(`Current simulated card count: ${simulatedCardCount}`);

  if (listOfSimulatedCards.length === 0) {
    while (simulatedCardCount < 300) {
      const randomCardInfo = await getRandomCardInfo();
      if (!randomCardInfo) {
        console.error('Failed to fetch random card info');
        break; // Exit the loop if no card info is returned
      }
      const cardUpdateInfo = await processRandomCard(randomCardInfo);
      updates.push(cardUpdateInfo);
      // simulatedCardCount++;
    }
    listOfSimulatedCards = await SimulatedCard.find({});
  } else {
    for (const simulatedCard of listOfSimulatedCards) {
      // logToAllSpecializedLoggers('info', `[SIMULATED_CARD]----->${JSON.stringify(simulatedCard)}`, {
      //   section: 'cronjob',
      //   action: 'log',
      //   data: simulatedCard,
      // });
      const cardUpdateInfo = await processSimulatedCard(simulatedCard);
      updates.push(cardUpdateInfo);
    }
  }

  return updates;
};

const updateMonitoredCard = async (card, newLatestPrice, quantity, now) => {
  const oldLatestPrice = card.latestPrice.num;

  if (isNaN(newLatestPrice) || isNaN(oldLatestPrice)) {
    console.error(`Invalid price for card ID ${card.id}`);
    return;
  }

  card.quantity = quantity; // Update the quantity

  if (oldLatestPrice !== newLatestPrice) {
    const priceDifference = newLatestPrice - oldLatestPrice;
    card.priceHistory.push({ num: newLatestPrice, timestamp: now });
    card.lastSavedPrice = { ...card.latestPrice };
    card.latestPrice = { num: newLatestPrice, timestamp: now };

    await card.save();
    logPriceChange(
      card,
      { latestPrice: card.latestPrice, lastSavedPrice: card.lastSavedPrice, priceDifference },
      false,
    );
  }
};

const processRandomCard = async (cardInfo) => {
  const cardId = cardInfo.id;
  const newLatestPrice = parseFloat(cardInfo.card_prices[0]?.tcgplayer_price || '0');
  const now = new Date();
  logToAllSpecializedLoggers(
    'info',
    `[NEW RANDOM CARD][${card.id}][${card.name}][${newLatestPrice}]`,
    {
      section: 'cronjob',
      action: 'log',
      data: card,
    },
  );
  let card = await SimulatedCard.findOne({ id: cardId });
  if (!card) {
    card = new SimulatedCard({
      id: cardId,
      tag: 'simulated',
      name: cardInfo.name,
      latestPrice: { num: newLatestPrice, timestamp: now },
      lastSavedPrice: { num: newLatestPrice, timestamp: now },
      priceHistory: [{ num: newLatestPrice, timestamp: now }],
    });
    await card.save();
    logPriceChange(
      card,
      { latestPrice: card.latestPrice, lastSavedPrice: card.lastSavedPrice, priceDifference: 0 },
      true,
    );
  }

  return {
    card, // Return the entire card object
    id: cardId,
    tag: 'simulated',
    status: card ? 'updated' : 'new',
    latestPrice: newLatestPrice,
  };
};

const processSimulatedCard = async (cardData) => {
  const cardId = cardData.id;
  const now = new Date();
  let card = await SimulatedCard.findOne({ id: cardId });

  if (!card) {
    console.error(`Simulated card not found for ID: ${cardId}`);
    return { id: cardId, type: 'simulated', status: 'not-found' };
  }

  try {
    const latestCardInfo = await getCardInfo(cardId);
    const newLatestPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || '0');

    // Check for a price change
    if (card.latestPrice.num !== newLatestPrice) {
      const oldLatestPrice = { ...card.latestPrice };
      const priceDifference = newLatestPrice - oldLatestPrice.num;

      card.priceHistory.push({ num: newLatestPrice, timestamp: now });
      card.lastSavedPrice = oldLatestPrice;
      card.latestPrice = { num: newLatestPrice, timestamp: now };

      await card.save();

      // Log the price change
      logPriceChange(
        card,
        {
          latestPrice: card.latestPrice,
          lastSavedPrice: card.lastSavedPrice,
          priceDifference: priceDifference,
        },
        false,
      );

      return {
        card, // returning the whole card object
        name: card.name,
        id: cardId,
        tag: 'simulated',
        status: 'updated',
        latestPrice: newLatestPrice,
        lastSavedPrice: oldLatestPrice,
      };
    } else {
      // Price has not changed, just update the timestamp
      card.latestPrice.timestamp = now;
      await card.save();
      return {
        card,
        name: card.name,
        id: cardId,
        tag: 'simulated',
        status: 'unchanged',
        latestPrice: newLatestPrice,
      };
    }
  } catch (error) {
    console.error(`Error processing simulated card (ID: ${cardId}):`, error);
    return { id: cardId, tag: 'simulated', status: 'error', error: error.message };
  }
};

const logPriceChange = (card, latestPriceEntry, isNewCard = false, cardIndex = null) => {
  if (!card || !latestPriceEntry) {
    console.error('[logPriceChange] -----> Invalid data provided for logging.');
    return;
  }

  logData(card, latestPriceEntry.lastSavedPrice.num);
  // Ensure latestPrice and lastSavedPrice are numbers
  const oldPrice = Number(latestPriceEntry.lastSavedPrice.num);
  const newPrice = Number(latestPriceEntry.latestPrice.num);
  if (isNaN(oldPrice) || isNaN(newPrice)) {
    console.error(`Invalid prices for card ID ${card.id}`);
    return;
  }

  const priceDifference = newPrice - oldPrice;
  const significantChangeThreshold = 0.01; // Define a threshold for significant price changes

  const indexPrefix = cardIndex !== null ? `[${cardIndex}] ` : '';
  const tagPrefix = card.tag === 'monitored' ? 'MONITORED' : 'SIMULATED';

  let message;
  if (isNewCard) {
    message = `${indexPrefix}NEW ${tagPrefix} CARD: ${card.name} (ID: ${
      card.id
    }) - Initial Price: $${newPrice.toFixed(2)}`.yellow;
  } else {
    let priceChangeMessage = `${tagPrefix} CARD ${card.name} (ID: ${
      card.id
    }) - Old Price: $${oldPrice.toFixed(2)}, New Price: $${newPrice.toFixed(2)}`;
    if (Math.abs(priceDifference) >= significantChangeThreshold) {
      const priceChangeText =
        priceDifference > 0
          ? ` (Increase by $${priceDifference.toFixed(2)})`.green
          : ` (Decrease by $${priceDifference.toFixed(2)})`.red;
      priceChangeMessage += priceChangeText;
    } else {
      priceChangeMessage += ' (No significant change)'.blue;
    }
    message = indexPrefix + priceChangeMessage;
  }

  console.log(message);
  fs.appendFileSync('price-changes.log', message + '\n');
};

// const logPriceChange = (card, latestPriceEntry, isNewCard = false, cardIndex = null) => {
//   if (
//     !card ||
//     typeof card !== 'object' ||
//     !latestPriceEntry ||
//     typeof latestPriceEntry !== 'object'
//   ) {
//     console.error('Invalid data provided for logging.');
//     return;
//   }

//   const messageParts = [];
//   const indexPrefix = cardIndex !== null ? `[${cardIndex}] ` : '';
//   const tagPrefix = card.tag === 'monitored' ? 'MONITORED' : 'SIMULATED';

//   if (isNewCard) {
//     messageParts.push(
//       `NEW ${tagPrefix} CARD: ${card.name} (ID: ${
//         card.id
//       }) - Initial Price: $${latestPriceEntry.latestPrice.num.toFixed(2)}`.yellow,
//     );
//   } else {
//     const oldPrice = latestPriceEntry.lastSavedPrice.num.toFixed(2);
//     const newPrice = latestPriceEntry.latestPrice.num.toFixed(2);
//     const priceDifference = latestPriceEntry.priceDifference.toFixed(2);

//     let priceChangeMessage = `${tagPrefix} CARD ${card.name} (ID: ${card.id}) - Old Price: $${oldPrice}, New Price: $${newPrice}`;
//     if (latestPriceEntry.priceDifference > 0) {
//       priceChangeMessage += ` (Increase by $${priceDifference})`.green;
//     } else if (latestPriceEntry.priceDifference < 0) {
//       priceChangeMessage += ` (Decrease by $${priceDifference})`.red;
//     } else {
//       priceChangeMessage += ' (No change)'.blue;
//     }

//     messageParts.push(priceChangeMessage);
//   }

//   const message = indexPrefix + messageParts.join(' ');
//   console.log(message);
//   fs.appendFileSync('price-changes.log', message + '\n');

//   // Optionally log to specialized loggers
//   logToAllSpecializedLoggers('info', `[DATA][${card.id}][${card.name}] - ${message}`, {
//     section: 'cronjob',
//     action: 'log',
//     data: card,
//   });
// };

module.exports = { trackCardPrices };

// const trackCardPrices = async (monitoredCards = [], listOfSimulatedCards = []) => {
//   let updates = []; // Array to hold updates for each card
//   let cardCount = await SimulatedCard.countDocuments();

//   for (const cardData of monitoredCards) {
//     try {
//       let card = await MonitoredCard.findOne({ id: cardData.id });
//       const now = new Date();
//       const newLatestPrice = parseFloat(cardData.latestPrice || '0');

//       if (!card) {
//         card = new MonitoredCard({
//           id: cardData.id,
//           name: cardData.name,
//           latestPrice: {
//             num: newLatestPrice,
//             timestamp: now,
//           },
//           priceHistory: [{ num: newLatestPrice, timestamp: now }],
//         });

//         await card.save();
//         logPriceChange(card, { latestPrice: card.latestPrice }, true);
//         updates.push({
//           id: cardData.id,
//           type: 'monitored',
//           status: 'new',
//           latestPrice: newLatestPrice,
//         });
//       } else {
//         // Update logic for existing monitored card
//         const oldLatestPrice = card.latestPrice.num;
//         if (oldLatestPrice !== newLatestPrice) {
//           const priceDifference = newLatestPrice - oldLatestPrice;

//           card.priceHistory.push({ num: newLatestPrice, timestamp: now });
//           card.latestPrice = { num: newLatestPrice, timestamp: now };

//           await card.save();

//           logPriceChange(
//             card,
//             {
//               latestPrice: card.latestPrice,
//               lastSavedPrice: { num: oldLatestPrice, timestamp: card.latestPrice.timestamp },
//               priceDifference: priceDifference,
//             },
//             false,
//           );
//         }
//         updates.push({
//           id: cardData.id,
//           type: 'monitored',
//           status: 'updated',
//           latestPrice: newLatestPrice,
//         });
//       }
//     } catch (error) {
//       console.error(`Error processing monitored card (ID: ${cardData.id}):`, error);
//     }
//   }
//   if (listOfSimulatedCards.length === 0) {
//     while (cardCount < 300) {
//       try {
//         const randomCardInfo = await getRandomCardInfo();
//         const cardId = randomCardInfo.id;
//         const newLatestPrice = parseFloat(randomCardInfo.card_prices[0]?.tcgplayer_price || '0');
//         const now = new Date();

//         // Check if the card already exists to prevent duplicates
//         let card = await SimulatedCard.findOne({ id: cardId });
//         if (!card) {
//           // Create a new card with initial latest price and last saved price
//           card = new SimulatedCard({
//             id: cardId,
//             tag: 'simulated',
//             name: randomCardInfo.name,
//             latestPrice: {
//               num: newLatestPrice,
//               timestamp: now,
//             },
//             lastSavedPrice: {
//               num: newLatestPrice,
//               timestamp: now,
//             },
//             priceHistory: [
//               {
//                 num: newLatestPrice,
//                 timestamp: now,
//               },
//             ],
//           });

//           await card.save();
//           logPriceChange(
//             card,
//             {
//               latestPrice: card.latestPrice,
//               lastSavedPrice: card.lastSavedPrice,
//               priceDifference: 0,
//               // priceHistory: card.priceHistory,
//             },
//             true,
//           );
//           updates.push({
//             id: randomCardInfo.id,
//             type: 'simulated',
//             status: 'new',
//             latestPrice: newLatestPrice,
//           });

//           cardCount++;
//         }
//       } catch (error) {
//         console.error('Error fetching random card information:', error);
//       }
//     }
//   } else {
//   const existingCards = await SimulatedCard.find();
//   for (let index = 0; index < existingCards.length; index++) {
//     const card = existingCards[index];
//     try {
//       const latestCardInfo = await getCardInfo(card.id);
//       const newLatestPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || '0');
//       const now = new Date();

//       // Check for a price change
//       if (card.latestPrice && card.latestPrice.num !== newLatestPrice) {
//         const oldLatestPrice = { ...card.latestPrice };
//         const priceDifference = newLatestPrice - oldLatestPrice.num;

//         card.priceHistory.push({
//           num: newLatestPrice,
//           timestamp: now,
//         });

//         card.latestPrice = { num: newLatestPrice, timestamp: now };
//         card.lastSavedPrice = oldLatestPrice;

//         await card.save();

//         // Log the price change
//         logPriceChange(
//           card,
//           {
//             latestPrice: card.latestPrice,
//             lastSavedPrice: card.lastSavedPrice,
//             priceDifference: priceDifference,
//           },
//           false,
//           index + 1,
//         );
//         updates.push({
//           id: card.id,
//           type: 'simulated',
//           status: 'updated',
//           latestPrice: newLatestPrice,
//         });
//       } else {
//         // Price has not changed, just update the timestamp
//         card.latestPrice.timestamp = now;
//         await card.save();
//       }

//       return {
//         updatedList: [], // Updated card list
//         changes: [], // Details of the changes made
//         // Other relevant data
//       };
// 		} catch (error) {
// 			console.error(`Error processing simulated card (ID: ${card.id}):`, error);
// 		}
// 	}

// 	return {
// 		updatedList: [], // Updated card list
// 		changes: [], // Details of the changes made
// 		// Other relevant data
// 	};
// }

// const logPriceChange = (card, latestPriceEntry, isNewCard = false, cardIndex = null, tag) => {
//   if (!latestPriceEntry || typeof latestPriceEntry !== 'object') {
//     console.error('Invalid latestPriceEntry provided for logging.');
//     return;
//   }
//   let message;
//   const indexPrefix = cardIndex !== null ? `[${cardIndex}] ` : '';

//   if (isNewCard) {
//     // For a new card, the old price is 'N/A' and the new price is the initial price
//     message = `NEW CARD: ${card.name} (ID: ${
//       card.id
//     }) - Initial Price: $${latestPriceEntry.latestPrice.num.toFixed(2)}`;
//     console.log(indexPrefix + message.yellow);
//     fs.appendFileSync('price-changes.log', indexPrefix + message + '\n');
//   } else {
//     // For an old card, calculate the price difference and structure the message accordingly
//     const oldPrice = latestPriceEntry.lastSavedPrice.num.toFixed(2);
//     const newPrice = latestPriceEntry.latestPrice.num.toFixed(2);
//     const priceDifference = latestPriceEntry.priceDifference.toFixed(2);

//     if (latestPriceEntry.priceDifference > 0) {
//       message = `PRICE INCREASE for ${card.name} (ID: ${card.id}): Old Price - $${oldPrice}, New Price - $${newPrice} (Increase by $${priceDifference})`;
//       console.log(indexPrefix + message.green); // Or red/blue based on the condition
//       fs.appendFileSync('price-changes.log', indexPrefix + `INCREASE: ${message}\n`); // Or DECREASE/NO CHANGE
//     } else if (latestPriceEntry.priceDifference < 0) {
//       message = `PRICE DECREASE for ${card.name} (ID: ${card.id}): Old Price - $${oldPrice}, New Price - $${newPrice} (Decrease by $${priceDifference})`;
//       console.log(indexPrefix + message.red);
//       fs.appendFileSync('price-changes.log', indexPrefix + `DECREASE: ${message}\n`);
//     } else {
//       message = `NO PRICE CHANGE for ${card.name} (ID: ${card.id}): The price remains at $${newPrice}`;
//       console.log(indexPrefix + message.blue);
//       fs.appendFileSync('price-changes.log', indexPrefix + `NO CHANGE: ${message}\n`);
//     }
//   }
// };
