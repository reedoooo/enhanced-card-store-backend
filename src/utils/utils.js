const { default: axios } = require('axios');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

/**
 * Handles errors in async functions.
 * @param {function} fn - The async function to be wrapped.
 * @returns {function} - The wrapped function.
 */
function sendJsonResponse(res, status, message, data) {
  res.status(status).json({ message, data });
}
/**
 * Formats a date object to the format "DD/MM/YYYY, HH:MM".
 * @param {Date} date - The date object to be formatted.
 * @returns {string} - The formatted date string.
 * */
const formatDateTime = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};
/**
 * Formats a date object to the format "DD/MM, HH:MMam/pm".
 * @param {Date} date - The date object to be formatted.
 * @returns {string} - The formatted date string.
 * */
const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours.toString().padStart(2, '0') : '12'; // the hour '0' should be '12'
  return `${day}/${month}, ${hours}:${minutes}${ampm}`;
};
/**
 * Creates a new price entry object.
 * @param {number} price - The price to be added to the price entry.
 * @returns {object} - The new price entry object.
 * */
const createNewPriceEntry = (price) => {
  return {
    num: price,
    timestamp: new Date(),
  };
};
/**
 * Removes duplicate price history entries from a collection of cards.
 * @param {object[]} cards - The collection of cards to be deduplicated.
 * @returns {object[]} - The collection of cards with deduplicated price history.
 * */
function removeDuplicatePriceHistoryFromCollection(cards) {
  // Iterate over each card in the collection
  return cards.map((card) => {
    const { priceHistory } = card;
    const uniquePriceHistory = priceHistory.reduce((unique, currentEntry) => {
      const duplicate = unique.find((entry) => entry.num === currentEntry.num);
      if (!duplicate) {
        unique.push(currentEntry); // If it's not a duplicate, add to the result
      } else {
        // If it is a duplicate, keep the entry with the earliest timestamp
        const currentTimestamp = new Date(currentEntry.timestamp).getTime();
        const duplicateTimestamp = new Date(duplicate.timestamp).getTime();

        if (currentTimestamp < duplicateTimestamp) {
          // Replace the duplicate with the current entry if it's earlier
          const duplicateIndex = unique.indexOf(duplicate);
          unique[duplicateIndex] = currentEntry;
        }
      }
      return unique;
    }, []);

    // Return the card with the updated (deduplicated) price history
    return {
      ...card,
      priceHistory: uniquePriceHistory,
    };
  });
}
/**
 * Fetches card info from the YGOProDeck API.
 * @param {string} cardName - The ID of the card to fetch.
 * @returns {object} - The card info object.
 * */
const getCardInfo = async (cardName) => {
  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?name=${encodeURIComponent(cardName)}`);
    // logger.info('Card info:', data?.data[0]);
    return data?.data[0];
  } catch (error) {
    logger.error(`Error fetching card info for card NAME ${cardName}:`, error);
    throw error;
  }
};
/**
 * Extracts the data from the request body.
 * @param {object} req - The request object.
 * @returns {object} - The extracted data.
 * */
const extractData = ({ body }) => {
  const { userSecurityData, userBasicData } = body;
  const { username, password, email, role_data } = userSecurityData;
  const { firstName, lastName } = userBasicData || {};

  return {
    username,
    password,
    email,
    role_data,
    firstName,
    lastName,
  };
};
/**
 * Calculates the total value of the collection.
 * @param {object} cards - The collection object.
 * @returns {number} - The total value of the collection.
 * */
const calculateCollectionValue = (cards) => {
  if (!cards?.cards && !Array.isArray(cards) && !cards?.name && !cards?.restructuredCollection) {
    console.warn('Invalid or missing collection', cards);
    return 0;
  }

  if (cards?.tag === 'new') {
    return 0;
  }
  if (cards?.restructuredCollection) {
    return cards?.restructuredCollection?.cards.reduce((totalValue, card) => {
      const cardPrice = card?.price || 0;
      const cardQuantity = card?.quantity || 0;
      return totalValue + cardPrice * cardQuantity;
    }, 0);
  }
  if (cards?.cards && Array.isArray(cards?.cards)) {
    return cards?.cards.reduce((totalValue, card) => {
      const cardPrice = card?.price || 0;
      const cardQuantity = card?.quantity || 0;
      return totalValue + cardPrice * cardQuantity;
    }, 0);
  }

  return cards.reduce((totalValue, card) => {
    const cardPrice = card.price || 0;
    const cardQuantity = card.quantity || 0;
    return totalValue + cardPrice * cardQuantity;
  }, 0);
};
const extractRawTCGPlayerData = (cardData) => {
  const {
    id,
    name,
    type,
    frameType,
    desc,
    atk,
    def,
    level,
    race,
    attribute,
    card_sets,
    card_images,
    card_prices,
  } = cardData;

  // Return the destructured card object (or directly return cardData for the entire object as is)
  return {
    id,
    name,
    type,
    frameType,
    desc,
    atk,
    def,
    level,
    race,
    attribute,
    card_sets,
    card_images,
    card_prices,
  };
};
const constructInitialCardData = (rawTcgPlayerData) => {
  let card_set = null;
  if (rawTcgPlayerData?.card_sets && rawTcgPlayerData?.card_sets?.length > 0) {
    card_set = rawTcgPlayerData?.card_sets[0];
  }
  return {
    price: rawTcgPlayerData?.card_prices[0]?.tcgplayer_price || 0,
    image:
      rawTcgPlayerData?.card_images.length > 0 ? rawTcgPlayerData.card_images[0].image_url : '',
    rarity: card_set?.set_rarity || '',
    rarities: rawTcgPlayerData?.card_sets?.reduce((acc, set) => {
      acc[set.set_name] = set.set_rarity;
      return acc;
    }, {}),
    sets: rawTcgPlayerData?.card_sets?.reduce((acc, set) => {
      acc[set.set_name] = set.set_name;
      return acc;
    }, {}),
    card_set: card_set ? card_set : {},
  };
};
/**
 * Constructs the card data object.
 * @param {object} cardData - The card data object.
 * @param {object} additionalData - The additional data object.
 * @returns {object} - The constructed card data object.
 * */
function constructCardDataObject(cardData, additionalData) {
  const tcgplayerPrice = cardData?.card_prices[0]?.tcgplayer_price || 0;
  const cardSet =
    cardData?.card_sets && cardData?.card_sets.length > 0 ? cardData.card_sets[0] : null;
  const defaultPriceObj = createNewPriceEntry(tcgplayerPrice);

  return {
    image: cardData?.card_images.length > 0 ? cardData.card_images[0].image_url : '',
    quantity: additionalData.quantity || 1,
    price: tcgplayerPrice,
    rarity: cardSet?.set_rarity,
    // create map for rarities
    rarities: cardData?.card_sets?.reduce((acc, set) => {
      acc[set.set_name] = set.set_rarity;
      return acc;
    }, {}),
    sets: cardData?.card_sets?.reduce((acc, set) => {
      acc[set.set_name] = set.set_name;
      return acc;
    }, {}),
    totalPrice: tcgplayerPrice,
    tag: additionalData.tag || '',
    collectionId: additionalData.collectionId,
    collectionModel: additionalData.collectionModel,
    cardModel: additionalData.cardModel,
    watchList: false,
    card_set: cardSet ? cardSet : {},
    card_sets: cardData?.card_sets,
    card_images: cardData?.card_images,
    card_prices: cardData?.card_prices,
    id: cardData?.id?.toString() || '',
    name: cardData?.name,
    // create map for chart_datasets organized by date
    // chart_datasets: cardData?.card_prices?.reduce((acc, price) => {
    //   if (!acc[addedAtFormatted]) acc[addedAtFormatted] = [];
    //   acc[addedAtFormatted].push({
    //     x: new Date(price.timestamp).getTime(),
    //     y: tcgplayerPrice,
    //   });
    //   return acc;
    // }, {}),

    lastSavedPrice: defaultPriceObj,
    latestPrice: defaultPriceObj,
    priceHistory: [],
    dailyPriceHistory: [],
    type: cardData?.type,
    frameType: cardData?.frameType,
    desc: cardData?.desc,
    atk: cardData?.atk,
    def: cardData?.def,
    level: cardData?.level,
    race: cardData?.race,
    attribute: cardData?.attribute,
    ...additionalData.contextualFields, // Merge any additional contextual fields
  };
}

module.exports = {
  getCardInfo,
  extractData,
  formatDateTime,
  calculateCollectionValue,
  createNewPriceEntry,
  formatDate,
  removeDuplicatePriceHistoryFromCollection,
  constructCardDataObject,
  sendJsonResponse,
  extractRawTCGPlayerData,
  constructInitialCardData,
  axiosInstance,
};
