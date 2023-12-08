const express = require('express');
const axios = require('axios');
const User = require('../../models/User');
const CardInCollection = require('../../models/CardInCollection'); // Import your CardInCollection model
const { default: mongoose } = require('mongoose');

const router = express.Router();

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
// const fetchCardData = async (cardId) => {
//   const response = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//   return response.data.data[0];
// };
// POST endpoint for fetching card information
router.post('/', async (req, res, next) => {
  const { name, race, type, level, attribute } = req.body;

  console.log('req.body:', req.body);
  try {
    const response = await axiosInstance.get(
      `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
    );
    console.log('response:', response.data.data);

    const transformedCards = response.data.data.map((card) => {
      const tcgplayerPrice = card.card_prices[0]?.tcgplayer_price || 0;

      return {
        id: card.id.toString(),
        name: card.name,
        type: card.type,
        frameType: card.frameType,
        desc: card.desc,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        archetype: [], // Assuming logic to determine this
        image: card.card_images.length > 0 ? card.card_images[0].image_url : '',
        card_sets: card.card_sets,
        card_images: card.card_images,
        card_prices: card.card_prices,
        quantity: 0,
        price: tcgplayerPrice,
        totalPrice: 0,
        lastSavedPrice: {
          num: tcgplayerPrice,
          timestamp: Date.now(),
        },
        latestPrice: {
          num: tcgplayerPrice,
          timestamp: Date.now(),
        },
        priceHistory: [
          {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
        ],
        dailyPriceHistory: [
          {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
        ],
        // Add other fields and transformations as needed
      };
    });

    console.log('Transformed Cards:', transformedCards);
    res.json({ ...response.data, data: transformedCards });
  } catch (error) {
    console.error('Error fetching card information:', error);
    res.status(500).send({ error: 'Internal Server Error' });
    next(error);
  }
});
// // POST endpoint for fetching card information
// router.post('/', async (req, res, next) => {
//   const { name, race, type, level, attribute } = req.body;

//   console.log('req.body:', req.body);
//   try {
//     const response = await axiosInstance.get(
//       `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
//     );
//     console.log('response:', response.data.data);
//     const tcgplayerPrice = response?.data?.map?.(
//       (card) => card?.card_prices[0]?.tcgplayer_price || 0,
//     );
//     const cardsWithQuantity = response?.data?.data.map((card) => ({
//       ...card,
//       quantity: 0,
//       price: tcgplayerPrice,
//       totalPrice: 0,
//       lastSavedPrice: {
//         num: tcgplayerPrice,
//         timestamp: Date.now(),
//       },
//       latestPrice: {
//         num: tcgplayerPrice,
//         timestamp: Date.now(),
//       },
//       priceHistory: [
//         {
//           num: tcgplayerPrice,
//           timestamp: Date.now(),
//         },
//       ],
//       dailyPriceHistory: [
//         {
//           num: tcgplayerPrice,
//           timestamp: Date.now(),
//         },
//       ],
//     }));
//     console.log('cardsWithQuantity:', cardsWithQuantity);
//     res.json({ ...response.data, data: cardsWithQuantity });
//   } catch (error) {
//     console.error('Error fetching card information:', error);
//     res.status(500).send({ error: 'Internal Server Error' });

//     next(error);
//   }
// });
// PATCH endpoint for updating a single card's information
// Utility function to check for missing or invalid data in a card
// function checkCardData(card) {
//   const missingData = [];
//   const fieldsToCheck = [
//     'name',
//     'id',
//     'type',
//     'desc',
//     'atk',
//     'def',
//     'level',
//     'race',
//     'attribute',
//     'card_sets',
//     'card_images',
//     'card_prices',
//   ];

//   fieldsToCheck.forEach((field) => {
//     if (!card[field] || card[field] === 0 || card[field].length === 0) {
//       missingData.push(field);
//     }
//   });

//   return missingData;
// }
// Utility function to update a document with retries
// Utility function to handle document updates with retry logic
// async function updateDocumentWithRetry(model, id, updateFunction, maxRetries = 3) {
//   let attempts = 0;
//   while (attempts < maxRetries) {
//     try {
//       const doc = await model.findById(id);
//       if (!doc) throw new Error('Document not found');
//       updateFunction(doc); // Apply updates
//       await doc.save();
//       break; // Break loop if save is successful
//     } catch (error) {
//       if (error instanceof mongoose.Error.VersionError && attempts < maxRetries - 1) {
//         attempts++;
//         console.log(`Retrying update (${attempts}):`, id);
//       } else {
//         throw error; // Rethrow if it's not a VersionError or retries are exhausted
//       }
//     }
//   }
// }

// PATCH endpoint for updating a single card's information
router.patch('/:cardId', async (req, res) => {
  const { cardId } = req.params;
  const userId = req.body.user?.id;
  const oldCardData = req.body.card;

  if (!userId) return res.status(401).json({ message: 'User authentication required' });

  try {
    const user = await User.findById(userId).populate('allCollections');
    if (!user) {
      // If user is not found, send an appropriate response
      return res.status(404).json({ message: 'User not found2', userId: userId });
    }
    const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    let updatedCardInfo = data?.data[0];

    // Ensuring valid numbers
    const tcgplayerPrice = updatedCardInfo.card_prices[0]?.tcgplayer_price || 0;
    const quantity = oldCardData?.quantity || 0;

    if (isNaN(tcgplayerPrice) || isNaN(quantity)) {
      console.error(
        `Invalid price or quantity for card ID ${cardId}: Price: ${tcgplayerPrice}, Quantity: ${quantity}`,
      );
      return res.status(400).json({ message: 'Invalid card data' });
    }

    updatedCardInfo.totalPrice = oldCardData?.totalPrice || tcgplayerPrice * quantity;
    updatedCardInfo.quantity = quantity;
    updatedCardInfo.price = tcgplayerPrice;

    user?.allCollections?.forEach((collection) => {
      if (!Array.isArray(collection?.cards)) {
        console.error(`Collection ${collection?._id} does not have a valid cards array`);
        return;
      }

      const cardIndex = collection?.cards.findIndex(
        (card) => card.id.toString() === cardId.toString(),
      );
      if (cardIndex === -1) {
        console.warn(`Card ${cardId} not found in collection ${collection?._id}`);
        return;
      }

      collection.cards[cardIndex] = { ...collection?.cards[cardIndex], ...updatedCardInfo };
    });
    // await updateDocumentWithRetry(User, userId, (user) => {
    //   if (!Array.isArray(user.allCollections)) {
    //     throw new Error('User collections are not in the expected format');
    //   }

    //   user?.allCollections?.forEach((collection) => {
    //     if (!Array.isArray(collection?.cards)) {
    //       console.error(`Collection ${collection?._id} does not have a valid cards array`);
    //       return;
    //     }

    //     const cardIndex = collection?.cards.findIndex((card) => card.id.toString() === cardId);
    //     if (cardIndex === -1) {
    //       console.warn(`Card ${cardId} not found in collection ${collection?._id}`);
    //       return;
    //     }

    //     collection.cards[cardIndex] = { ...collection?.cards[cardIndex], ...updatedCardInfo };
    //   });
    // });

    res.status(200).json({ message: 'Card updated successfully', data: updatedCardInfo });
  } catch (error) {
    console.error(`Error updating card info for card ID ${cardId}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// router.patch('/:cardId', async (req, res, next) => {
//   if (!req.body.user || !req.body.user.id) {
//     return res
//       .status(401)
//       .json({ message: 'User information is missing or not authenticated', data: req.body });
//   }

//   const cardId = req.params.cardId;
//   const userId = req.body.user.id;

//   try {
//     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//     const updatedCardInfo = data.data[0];

//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) {
//       // If user is not found, send an appropriate response
//       return res.status(404).json({ message: 'User not found', userId: userId });
//     }
//     let cardSuccessfullyUpdated = false;
//     let missingDataSummary = [];

//     user.allCollections.forEach((collection) => {
//       const cardIndex = collection.cards.findIndex((card) => card.id.toString() === cardId);
//       if (cardIndex !== -1) {
//         collection.cards[cardIndex] = {
//           ...collection.cards[cardIndex],
//           ...updatedCardInfo,
//         };
//         cardSuccessfullyUpdated = true;

//         // Check for missing or invalid data
//         const missingData = checkCardData(collection.cards[cardIndex]);
//         if (missingData.length > 0) {
//           missingDataSummary.push({ cardId: cardId, missingData: missingData });
//         }
//       }
//     });

//     if (cardSuccessfullyUpdated) {
//       await Promise.all(user.allCollections.map((collection) => collection.save()));
//       return res.status(200).json({
//         message: 'Card updated successfully',
//         data: updatedCardInfo,
//         missingDataSummary: missingDataSummary.length > 0 ? missingDataSummary : 'No missing data',
//       });
//     } else {
//       return res.status(404).json({ message: 'Card not found in user collections' });
//     }
//   } catch (error) {
//     console.error(`Error updating card info for card ID ${cardId}:`, error);
//     res.status(500).json({ message: error.message, data: req.body });
//     next(error);
//   }
// });

function queryBuilder(name, race, type, level, attribute) {
  const queryParts = [];

  if (name) queryParts.push(`fname=${encodeURIComponent(name)}`);
  if (race) queryParts.push(`race=${encodeURIComponent(race)}`);
  if (type) queryParts.push(`type=${encodeURIComponent(type)}`);
  if (level) queryParts.push(`level=${encodeURIComponent(level)}`);
  if (attribute) queryParts.push(`attribute=${encodeURIComponent(attribute)}`);

  return queryParts.join('&');
}

module.exports = router;
// router.patch('/:cardId', async (req, res, next) => {
//   if (!req.body.user) {
//     return res.status(401).json({ message: 'User not authenticated', data: req.body });
//   }

//   const cardId = req.params.cardId; // card ID is in req.params

//   const userId = req.body.user.id; // user ID is in req.body.user.id

//   const oldCardData = req.body.card;

//   try {
//     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//     const updatedCardInfo = data.data[0];

//     console.log('UPDATED --------------->:', updatedCardInfo);
//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) throw new Error('User not found');

//     let cardSuccessfullyUpdated = false;
//     user.allCollections.forEach((collection) => {
//       const cardIndex = collection.cards.findIndex((card) => card.id.toString() === cardId);
//       if (cardIndex !== -1) {
//         collection.cards[cardIndex] = {
//           ...collection.cards[cardIndex],
//           card_images: [{ ...updatedCardInfo?.card_images[0] }],
//           card_sets: [{ ...updatedCardInfo?.card_sets[0] }],
//           card_prices: [{ ...updatedCardInfo?.card_prices[0] }],
//           // Add any other properties you need to update
//         };
//         if (oldCardData) {
//           collection.cards[cardIndex] = {
//             ...collection.cards[cardIndex],
//             ...oldCardData,
//           };
//           console.log(
//             'collection.cards[cardIndex]  --------------->:',
//             collection.cards[cardIndex],
//           );
//         }
//         cardSuccessfullyUpdated = true;
//       }
//     });

//     if (cardSuccessfullyUpdated) {
//       await Promise.all(user.allCollections.map((collection) => collection.save()));

//       await user.save();

//       return res
//         .status(200)
//         .json({ message: 'Card updated successfully', data: user.allCollections });
//     } else {
//       return res.status(404).json({ message: 'Card not found in user collections' });
//     }
//   } catch (error) {
//     console.error(`Error updating card info for card ID ${cardId}:`, error);
//     res.status(500).json({ message: error.message, data: req.body });
//     next(error);
//   }
// });

// // PATCH endpoint for updating a single card's information
// router.patch('/:cardId', async (req, res, next) => {
//   if (!req.body.user) {
//     return res.status(401).json({ message: 'User not authenticated', data: req.body });
//   }
//   // card id is in req.params
//   const { id } = req.body;
//   console.log('ID 1 -------', id);

//   // must convert from string to number
//   const parsedID = parseInt(id);
//   console.log('ID 2 -------', parsedID);

//   // user id is in req.body
//   const userId = req.body.user.id;
//   console.log('ID 3 -------', userId);

//   try {
//     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(parsedID)}`);
//     console.log('data:', data);
//     const updatedCardInfo = data.data[0];
//     console.log('updatedCardInfo:', updatedCardInfo);
//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) throw new Error('User not found');

//     // user.allCollections.forEach((collection) => {
//     //   const cardIndex = collection.cards.findIndex((card) => card.id === cardId);
//     //   if (cardIndex !== -1) {
//     //     const updatedCard = { ...collection.cards[cardIndex], ...req.body };
//     //     if (!updatedCard.id || !updatedCard.name) {
//     //       console.error('Updated card is missing required fields: ', updatedCard);
//     //       // Handle the error appropriately
//     //     } else {
//     //       collection.cards[cardIndex] = updatedCard;
//     //     }
//     //   }
//     // });

//     user.allCollections.forEach((collection) => {
//       const cardIndex = collection.cards.findIndex((card) => card.id === parsedID);
//       if (cardIndex !== -1) {
//         // Update card information
//         const oldCard = collection.cards[cardIndex];
//         const newCard = {
//           ...oldCard,
//           card_images: updatedCardInfo.card_images,
//           card_sets: updatedCardInfo.card_sets,
//           card_prices: updatedCardInfo.card_prices,
//           // archetype: updatedCardInfo.archetype,
//           // Add any other properties you need to update
//         };

//         // Replace the old card with the updated one
//         collection.cards[cardIndex] = newCard;
//       }
//     });

//     await Promise.all(user.allCollections.map((collection) => collection.save()));
//     let cardSuccessFullyUpdatedWithImagesPricesSets = false;
//     if (user.allCollections.forEach((collection) => collection.cards)) {
//       if (for const (card of collection.cards) {
//           if (card.card_images && card.card_prices && card.card_sets) {
//             cardSuccessFullyUpdatedWithImagesPricesSets = true;
//           }

//         })

//       }

//     }

//     if (cardSuccessFullyUpdatedWithImagesPricesSets) {
//       return res.status(200).json({ message: 'Card updated successfully', data: user.allCollections });
//     }
//   } catch (error) {
//     console.error(`Error updating card info for card ID ${parsedID}:`, error);
//     res.status(500).json({ message: error.message, data: req.body });
//     next(error);
//   }
// });

// PATCH endpoint for updating all cards in all collections
// router.patch('/updateAll', async (req, res) => {
//   const userId = req.user._id; // Assuming user ID is available in the request

//   try {
//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) throw new Error('User not found');

//     for (const collection of user.allCollections) {
//       for (const card of collection.cards) {
//         const updatedCardData = await fetchCardData(card.id);
//         Object.assign(card, updatedCardData);
//       }
//     }

//     await Promise.all(user.allCollections.map((collection) => collection.save()));
//     res.status(200).json({ message: 'All cards updated successfully' });
//   } catch (error) {
//     console.error('Error updating all cards:', error);
//     res.status(500).json({ message: error.message });
//   }
// });

// Helper function for building query strings

// const express = require('express');
// const axios = require('axios');
// const getSingleCardInfo = require('../../utils/cardUtils');
// const router = express.Router();

// // Create axios instance with base URL
// const instance = axios.create({
//   baseURL: 'https://db.ygoprodeck.com/api/v7/',
// });

// router.post('/', async (req, res) => {
//   const { name, race, type, level, attribute } = req.body;

//   try {
//     const response = await instance.get(
//       `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
//     );

//     // Add a quantity property to each card
//     const cardsWithQuantity = response.data.data.map((card) => {
//       return { ...card, quantity: 0 }; // Set initial quantity to 0
//     });

//     res.json({
//       ...response.data,
//       data: cardsWithQuantity,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// });

// router.patch('/:cardId', async (req, res) => {
//   try {
//     const { cardId } = req.params;
//     //     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//     //     const updatedCardInfo = data.data[0];

//     const cardData = req.body;
//     const userId = req.user._id; // Assuming you have user ID available in the request

//     const result = await getSingleCardInfo(userId, cardId, cardData); // Pass cardData to the function
//     res.status(200).json({ data: result, message: 'Card updated successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// function queryBuilder(name, race, type, level, attribute) {
//   let query = '';

//   if (name) {
//     query += `&fname=${encodeURIComponent(name)}`;
//   }

//   if (race) {
//     query += `&race=${encodeURIComponent(race)}`;
//   }

//   if (type) {
//     query += `&type=${encodeURIComponent(type)}`;
//   }

//   if (level) {
//     query += `&level=${encodeURIComponent(level)}`;
//   }

//   if (attribute) {
//     query += `&attribute=${encodeURIComponent(attribute)}`;
//   }

//   return query.startsWith('&') ? query.substring(1) : query;
// }

// module.exports = router;
