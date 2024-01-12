// const { CardVariant, CardSet } = require('./Card');

require('colors');
/**
 * function for populating the CardSet and CardVariant fields of a card
 * @param {Object} card - Card object
 * @constant {Array} card.cardVariants - Card variants array
 * @constant {Array} card.card_sets - Card sets array
 * @constant {Object} card.variant - Card variant object
 * @constant {Object} card.variant.alt_art_image_url - Card variant alt art image URL
 * @constant {Array} card.card_images - Card images array
 * @constant {Number} card.price - Card price
 * @constant {Number} card.quantity - Card quantity
 * @constant {Number} card.totalPrice - Card total price
 * @constant {Object} card.latestPrice - Card latest price
 * @constant {Object} card.lastSavedPrice - Card last saved price
 * @constant {Array} card.priceHistory - Card price history array
 * @constant {String} card.cardModel - Card model name
 * @constant {String} card.collectionModel - Card collection model name
 * @constant {String} card.refId - Card reference ID
 * @constant {String} card.collectionId - Card collection ID
 * @returns {void}
 * */
// async function populateCardVariants(card) {
//   try {
//     const cardSets = await CardSet.find({ cardId: card._id });
//     card.cardVariants = cardSets.map((set) => {
//       let variant = new CardVariant({
//         set_name: set.set_name,
//         set_code: set.set_code,
//         rarity: set.set_rarity,
//         rarity_code: set.set_rarity_code,
//         price: set.set_price,
//         selected: false,
//         alt_art_image_url: '',
//         set: set._id, // reference to the CardSet
//       });
//       return variant;
//     });
//   } catch (error) {
//     console.error(`Error populating card variants: ${error.message}`);
//     throw error;
//   }
// }
/**
 * Select first variant if none selected
 * @param {Object} card - Card object
 * @constant {Array} card.cardVariants - Card variants array
 * @constant {Array} card.card_sets - Card sets array
 * @constant {Object} card.variant - Card variant object
 * @constant {Object} card.variant.alt_art_image_url - Card variant alt art image URL
 * @constant {Array} card.card_images - Card images array
 * @constant {Number} card.price - Card price
 * @constant {Number} card.quantity - Card quantity
 * @constant {Number} card.totalPrice - Card total price
 * @constant {Object} card.latestPrice - Card latest price
 * @constant {Object} card.lastSavedPrice - Card last saved price
 * @constant {Array} card.priceHistory - Card price history array
 * @constant {String} card.cardModel - Card model name
 * @constant {String} card.collectionModel - Card collection model name
 * @constant {String} card.refId - Card reference ID
 * @constant {String} card.collectionId - Card collection ID
 * @returns {void}
 * */
// async function selectFirstVariantIfNoneSelected(card) {
//   console.log(`[SELECTING FIRST VARIANT: ${card.name}]`.green + ' PRE SAVED CARD: ', card.price);
//   card.cardVariants = card.cardVariants || [];
//   if (card.cardVariants.length === 0 && card.card_sets.length > 0) {
//     await populateCardVariants(card);
//   }
//   if (!card.cardVariants.some((v) => v.selected) && card.cardVariants.length > 0) {
//     card.cardVariants[0].selected = true;
//     card.variant = card.cardVariants[0];
//   }
// }
/**
 * Set alt_art_image_url
 * @param {Object} card - Card object
 * @constant {Object} card.card_images - Card images array
 * @constant {String} card.id - Card ID
 * @constant {String} card.variant.alt_art_image_url - Card variant alt art image URL
 * @constant {Array} card.alt_art_ids - Card alt art IDs
 * @returns {void}
 */
// function setAltArtDetails(card) {
//   const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
//   if (altArtImage) card.variant.alt_art_image_url = altArtImage.image_url;
//   card.alt_art_ids = card.card_images.filter((img) => img.id !== card.id).map((img) => img.id);
// }
/**
 * Set variant details
 * @param {Object} card - Card object
 * @constant {Object} card.variant - Card variant object
 * @constant {String} card.variant.rarity - Card variant rarity
 * @returns {void}
 * */
// function setVariantDetails(card) {
//   card.rarity = card.variant.rarity;
//   setAltArtDetails(card);
// }
/**
 * Update card details before saving
 * @param {Object} card - Card object
 * @constant {Array} card.cardVariants - Card variants array
 * @constant {Array} card.card_sets - Card sets array
 * @constant {Object} card.variant - Card variant object
 * @constant {Object} card.variant.alt_art_image_url - Card variant alt art image URL
 * @constant {Array} card.card_images - Card images array
 * @constant {Number} card.price - Card price
 * @constant {Number} card.quantity - Card quantity
 * @constant {Number} card.totalPrice - Card total price
 * @constant {Object} card.latestPrice - Card latest price
 * @constant {Object} card.lastSavedPrice - Card last saved price
 * @constant {Array} card.priceHistory - Card price history array
 * @constant {String} card.cardModel - Card model name
 * @constant {String} card.collectionModel - Card collection model name
 * @constant {String} card.refId - Card reference ID
 * @constant {String} card.collectionId - Card collection ID
 * @returns {void}
 * */
// function updateCardDetails(card) {
//   // implement function to check if cardVariants array has already been populated, and if variant has already been selected
//   // if cardVariants array is empty and card_sets array is not empty, then select the first variant and set cardVariants array
//   if (!card.cardVariants.length && card.card_sets.length) {
//     // await selectFirstVariantIfNoneSelected(card);
//   } else if (card.cardVariants.length) {
//     console.log(
//       `[CARDVARIANTS HAS ALREADY BEEN POPULATED]: ${card.name}]`.green + ' PRE SAVED CARD: ',
//       card.cardVariants,
//     );
//   }
//   // if (!card.variant && card.cardVariants.length > 0) card.variant = card.cardVariants[0];
//   setVariantDetails(card);

//   card.image = card.variant.alt_art_image_url || card.card_images[0]?.image_url || '';
//   card.totalPrice = card.price * card.quantity;
//   card.contextualQuantity[card.cardModel] = card.quantity;
//   card.contextualTotalPrice[card.cardModel] = card.totalPrice;

//   if (card.latestPrice?.num !== card.lastSavedPrice.num) {
//     card.priceHistory.push(card.latestPrice);
//     card.lastSavedPrice = card.latestPrice;
//   }
// }

module.exports = {
  // populateCardVariants,
  // selectFirstVariantIfNoneSelected,
  // setAltArtDetails,
  // setVariantDetails,
  // updateCardDetails,
};

// const fetchCardSetDetails = async (setId) => {
//   try {
//     const _id = setId._id || setId;
//     const cardSetDetails = await CardSet.findById(
//       _id,
//       'set_name set_code set_rarity set_rarity_code set_price',
//     );
//     if (!cardSetDetails) {
//       console.warn(`Card set with ID ${setId._id} not found`);
//       return null; // Return null or some default object
//     }
//     return cardSetDetails;
//   } catch (error) {
//     console.error(`Error fetching card set details for ID ${setId}:`, error);
//     throw error;
//   }
// };
// Helper functions
// Function to populate card sets and variants for a card
// async function populateCardDetails(cardId) {
//   try {
//     const card = await Card.findById(cardId);
//     if (!card) {
//       throw new Error(`Card with ID ${cardId} not found`);
//     }

//     // Populate card sets
//     const cardSets = await CardSet.find({ cardId: card._id });
//     card.card_sets = cardSets.map((set) => set._id);

//     // Populate card variants based on card sets
//     card.cardVariants = cardSets.map((set) => ({
//       set_name: set.set_name,
//       set_code: set.set_code,
//       rarity: set.set_rarity,
//       rarity_code: set.set_rarity_code,
//       price: set.set_price,
//       selected: false, // default selection status
//       alt_art_image_url: '', // default alt art image URL
//     }));

//     await card.save();
//     return card;
//   } catch (error) {
//     console.error(`Error populating card details: ${error.message}`);
//     throw error;
//   }
// }
// Helper functions
// async function populateCardDetails(cardId) {
//   try {
//     const card = await Card.findById(cardId);
//     if (!card) {
//       throw new Error(`Card with ID ${cardId} not found`);
//     }

//     // Populate card sets
//     const cardSets = await CardSet.find({ cardId: card._id });
//     card.card_sets = cardSets.map((set) => set._id);

//     // Populate card variants based on card sets
//     card.cardVariants = cardSets.map((set) => ({
//       set_name: set.set_name,
//       set_code: set.set_code,
//       rarity: set.set_rarity,
//       rarity_code: set.set_rarity_code,
//       price: set.set_price,
//       selected: false, // default selection status
//       alt_art_image_url: '', // default alt art image URL
//       set: set._id, // Reference to the CardSet
//     }));

//     await card.save();
//     return card;
//   } catch (error) {
//     console.error(`Error populating card details: ${error.message}`);
//     throw error;
//   }
// }
// }
// async function selectFirstVariantIfNoneSelected(card) {
//   if (!card.cardVariants.length && card.card_sets.length) {
//     card.cardVariants = await Promise.all(
//       card.card_sets.map(async (setId) => {
//         const set = await CardSet.findById(setId);
//         if (!set) return null;
//         return new CardVariant({
//           set_name: set.set_name,
//           set_code: set.set_code,
//           rarity: set.set_rarity,
//           rarity_code: set.set_rarity_code,
//           price: set.set_price,
//           selected: false,
//           set: setId,
//         });
//       }),
//     );

//     if (card.cardVariants.length > 0) {
//       card.cardVariants[0].selected = true;
//       card.variant = card.cardVariants[0];
//     }
//   }
// }
// async function selectFirstVariantIfNoneSelected(card) {
//   console.log(`[SELECTING FIRST VARIANT: ${card.name}]`.green + ' PRE SAVED CARD: ', card.price);
//   // Ensure cardVariants is initialized to an empty array if not set
//   card.cardVariants = card.cardVariants || [];

//   if (!card.cardVariants.length && card.card_sets.length) {
//     card.cardVariants = await Promise.all(
//       card.card_sets.map(async (setId) => {
//         if (!setId) {
//           console.warn('No setId provided');
//           return null; // Handle null setId
//         }

//         const detailedSet = await fetchCardSetDetails(setId);
//         if (!detailedSet) {
//           return null; // Handle null detailedSet
//         }

//         let altArtImageUrl = '';
//         const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
//         if (altArtImage) {
//           altArtImageUrl = altArtImage.image_url;
//         }

//         return {
//           set_name: detailedSet.set_name || '',
//           set_code: detailedSet.set_code || '',
//           rarity: detailedSet.set_rarity || '',
//           rarity_code: detailedSet.set_rarity_code || '',
//           price: detailedSet.set_price || 0,
//           selected: card?.variant?.selected || false, // Preserve existing selection status
//           alt_art_image_url: altArtImageUrl || '', // Use alt art image if available
//         };
//       }),
//     );

//     // Select the first variant if none are selected
//     if (!card.cardVariants.some((v) => v.selected) && card.cardVariants.length > 0) {
//       card.cardVariants[0].selected = true;
//       card.variant = card.cardVariants[0];
//     }
//   }
// }

// async function selectFirstVariantIfNoneSelected(card) {
//   console.log(`[SELECTING FIRST VARIANT: ${card.name}]`.green + ' PRE SAVED CARD: ', card.price);
//   // if no variants exist and card_sets exist
//   if (!card.cardVariants.length && card.card_sets.length) {
//     // card variants promise array is an array of promises that resolve to card variants
//     // card.cardVariants = await Promise.all(
//     //   // map over card_sets and return a promise for each card_set, which resolves to a card variant. The setId is the id of the card set
//     //   card.card_sets.map(async (setId) => {
//     const variantPromises = card.card_sets.map(async (setId) => {
//       if (!setId) {
//         console.warn('No setId provided');
//         return null; // Handle null setId
//       }
//       const detailedSet = await fetchCardSetDetails(setId);
//       if (!detailedSet) {
//         return null; // Handle null detailedSet
//       }
//       // id values for the card set
//       let altArtImageUrl = '';
//       // if an alt art image exists, set the alt_art_image_url
//       const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
//       if (altArtImage) {
//         altArtImageUrl = altArtImage.image_url;
//       }
//       return {
//         set_name: detailedSet.set_name,
//         set_code: detailedSet.set_code,
//         rarity: detailedSet.set_rarity,
//         rarity_code: detailedSet.set_rarity_code,
//         price: detailedSet.set_price,
//         selected: card?.variant?.selected || false, // Default value or derived from detailedSet
//         alt_art_image_url: altArtImageUrl
//           ? (card.variant.alt_art_image_url = altArtImage.image_url)
//           : '',
//       };
//     });

//     // if none of the variants are selected
//     if (!card.cardVariants.some((v) => v.selected)) {
//       // if no variant is selected, select the first one
//       if (card.cardVariants.length > 0) {
//         card.cardVariants[0].selected = true;
//         card.variant = card.cardVariants[0];
//       }
//     }

//     card.cardVariants = (await Promise.all(variantPromises)).filter(Boolean); // Exclude null values
//   }
// }
// Helper functions

// if (!card.cardVariants.length && card.card_sets.length) {
//   // Populate variants based on card sets
//   const variantPromises = card.card_sets.map(async (setId) => {
//     if (!setId) {
//       console.warn('No setId provided');
//       return null; // Handle null setId
//     }
//     const detailedSet = await CardSet.findById(setId);
//     if (!detailedSet) {
//       return null; // Handle null detailedSet
//     }

//     let altArtImageUrl = '';
//     const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
//     if (altArtImage) {
//       altArtImageUrl = altArtImage.image_url;
//     }

//     return new CardVariant({
//       set_name: detailedSet.set_name || '',
//       set_code: detailedSet.set_code || '',
//       rarity: detailedSet.set_rarity || '',
//       rarity_code: detailedSet.set_rarity_code || '',
//       price: detailedSet.set_price || 0,
//       selected: false, // Default selection status
//       alt_art_image_url: altArtImageUrl || '',
//       set: detailedSet._id, // Link to the CardSet
//     });
//   });

//   card.cardVariants = (await Promise.all(variantPromises)).filter(Boolean);
//   // Automatically select the first variant if none are selected
//   if (!card.cardVariants.some((v) => v.selected) && card.cardVariants.length > 0) {
//     card.cardVariants[0].selected = true;
//     card.variant = card.cardVariants[0];
//   }
// }

// function setAltArtDetails(card) {
//   // then set the alt_art_image_url
//   const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
//   if (altArtImage) {
//     card.variant.alt_art_image_url = altArtImage.image_url || card.image_url;
//   }
//   console.log(
//     `[ALT ART IMAGE URL SET FOR : ${card.name}]`.green + ' PRE SAVED CARD: ',
//     card?.variant?.alt_art_image_url,
//   );

//   const altArtImages = card.card_images.filter((img) => img.id !== card.id);
//   if (altArtImages.length) {
//     card.alt_art_ids = altArtImages.map((img) => img.id) || [card.id];
//   }
//   console.log(
//     `[ALT ART IDS SET FOR : ${card.name}]`.green + ' PRE SAVED CARD: ',
//     card?.alt_art_ids,
//   );
// }
// function setVariantDetails(card) {
//   // const selectedVariant = card.cardVariants.find((v) => v.selected) || card.cardVariants[0] || {};
//   card.rarity = card.variant.rarity;
//   setAltArtDetails(card);
// }
// async function updateCardDetails(card) {
//   console.log(`[UPDATING CARD: ${card.name}]`.green + ' PRE SAVED CARD: ', card.price);

//   await selectFirstVariantIfNoneSelected(card);
//   if (!card.variant && !card.cardVariants.length) {
//     throw new Error('No variant selected and no cardVariants', card?.variant, card?.cardVariants);
//   }
//   console.log(`[VARIANT SELECTED]: ${card.name}]`.green + ' PRE SAVED CARD: ', card.variant);
//   setVariantDetails(card);
//   console.log(`[VARIANT DETAILS SET]: ${card.name}]`.green + ' PRE SAVED CARD: ', card.variant);

//   // updates the default image to the alt art image if it exists
//   if (card.variant.alt_art_image_url && card.variant.alt_art_image_url !== card.image) {
//     card.image = card.variant.alt_art_image_url;
//   } else {
//     card.image = card.card_images[0]?.image_url || '';
//   }
//   card.totalPrice = card.price * card.quantity;
//   card.contextualQuantity[card.cardModel] = card.quantity;
//   card.contextualTotalPrice[card.cardModel] = card.totalPrice;

//   if (card?.latestPrice?.num !== card.lastSavedPrice.num) {
//     card.priceHistory.push(card.latestPrice);
//     card.lastSavedPrice = card.latestPrice;
//   }
//   console.log(
//     `[CARD PRICES AND QUANTITIES UPDATED]: ${card.name}]`.green + ' PRE SAVED CARD: ',
//     card?.price,
//   );
//   card.cardModel = card.cardModel || card.constructor.modelName;
//   card.collectionModel = card.collectionModel || card.constructor.modelName;
//   card.refId = card.refId || card._id;
//   card.collectionId = card.collectionId || null;
//   console.log(
//     `[CARD IDENTIFICATION UPDATED]: ${card.name}]`.green +
//       ' PRE SAVED CARD: CARDMODEL, COLLECTIONMODEL, REFID, COLLECTIONID ',
//     card.cardModel,
//     card.collectionModel,
//     card.refId,
//     card.collectionId,
//   );
//   console.log(`[CARD UPDATED SUCCESSFULLY]: ${card.name}]`.green + ' PRE SAVED CARD: ', card.name);
// }
