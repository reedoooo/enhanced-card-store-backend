/**
 * Helper function to get contextual quantities and total price.
 * @param {Object} card - The card object.
 * @param {string} context - The context.
 * @returns {Object} - An object containing contextual quantities and total price.
 */
async function getContextualValue(card, contexts, context, property) {
  if (!card || !contexts || !context || !property || !contexts[context]) {
    console.error('Invalid parameters for getContextualValue');
    return {};
  }

  const value = card[property];
  if (typeof value === 'undefined') {
    console.error(`Property ${property} not found on card`);
    return {};
  }

  return { [contexts[context]]: value };
}
/**
 * Builds a query string from an object containing query parameters.
 * @param {Object}  - An object containing the query parameters.
 * @returns {string} - A query string containing the parameters.
 */
function queryBuilder(name, race, type, level, attribute, id) {
  console.log(`[SEARCH QUERY CONTENTS][${(name, race, type, level, attribute, id)}]`);

  const queryParts = [
    name && `fname=${encodeURIComponent(name)}`,
    race && `race=${encodeURIComponent(race)}`,
    type && `type=${encodeURIComponent(type)}`,
    level && `level=${encodeURIComponent(level)}`,
    attribute && `attribute=${encodeURIComponent(attribute)}`,
    id && `id=${encodeURIComponent(id)}`,
  ].filter(Boolean);

  return queryParts.join('&');
}
/**
 * Fetches card prices from the YGOPRODeck API.
 * @param {string} cardName - The exact name of the Yu-Gi-Oh! card.
 * @returns {Promise<Object>} - A promise that resolves to an object containing card prices.
 */
async function fetchCardPrices(cardName) {
  const encodedName = encodeURIComponent(cardName);
  // const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodedName}`;
  const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodedName}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('Card not found');
    }

    return data.data[0].card_prices;
  } catch (error) {
    console.error(`Error fetching card prices: ${error}`);
    throw error;
  }
}
/**
 * Fetches card images from the YGOPRODeck API.
 * @param {string} cardName - The exact name of the Yu-Gi-Oh! card.
 * @returns {Promise<Object>} - A promise that resolves to an object containing card images.
 */
async function fetchCardImages(cardName) {
  const encodedName = encodeURIComponent(cardName);
  const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodedName}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('Card not found');
    }

    return data.data[0].card_images;
  } catch (error) {
    console.error(`Error fetching card images: ${error}`);
    throw error;
  }
}
/**
 * Updates a card with the latest prices.
 * @param {Object} card - The card object.
 * @returns {Object} - The updated card object.
 */
const updateCardWithLatestPrices = async (card) => {
  const fetchedPrices = await fetchCardPrices([card.name]);
  const updatedPrice = fetchedPrices[card.name]?.tcgplayer_price || card.price;
  const contexts = ['SearchHistory', 'Collection', 'Deck', 'Cart'];

  contexts.forEach((context) => {
    card.contextualQuantities[context] = getContextualValue(card, 'quantity', context);
    card.contextualTotalPrice[context] = getContextualValue(card, 'totalPrice', context);
  });

  card.latestPrice = { num: updatedPrice, timestamp: Date.now() };
  card.price = updatedPrice;
  card.totalPrice = updatedPrice * card.quantity;
  card.dataOfLastPriceUpdate = Date.now();
  return card;
};

module.exports = {
  // createCardData,
  getContextualValue,
  queryBuilder,
  fetchCardPrices,
  fetchCardImages,
  updateCardWithLatestPrices,
};
