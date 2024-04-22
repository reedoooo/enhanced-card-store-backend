const { User } = require('../../models/User');

/**
 * Returns an array of fields to be populated when deep populating card data.
 * @returns {Array} An array of fields to be populated.
 */
function deepPopulateCardFields() {
  return [
    { path: 'card_sets', model: 'CardSet' },
    {
      path: 'cardVariants',
      model: 'CardVariant',
      populate: [
        { path: 'set', model: 'CardSet' },
        // { path: 'variant', model: 'CardVariant' },
      ],
    },
    { path: 'variant', model: 'CardVariant' },
  ];
}
/**
 * Returns the populate path for a given context.
 *
 * @param {string} context - The context for which to get the populate path.
 * @returns {Object} - The populate path object.
 * @throws {Error} - If an invalid context is provided.
 */
function getPopulatePathForContext(context) {
  switch (context) {
    case 'decks':
      return {
        path: 'allDecks',
        populate: {
          path: 'cards',
          model: 'CardInDeck',
          populate: deepPopulateCardFields(),
        },
      };
    case 'collections':
      return {
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: deepPopulateCardFields(),
        },
      };
    case 'cart':
      return {
        path: 'cart',
        populate: {
          path: 'items',
          model: 'CardInCart',
          populate: deepPopulateCardFields(),
        },
      };
    default:
      throw new Error('Invalid context');
  }
}
/**
 * Populate the user's data based on context
 * @param {string} userId - The ID of the user to populate data for
 * @param {string} context - The context to populate (decks, collections, cart)
 * @returns Populated user data
 */
async function populateUserDataByContext(userId, contexts) {
  let query = User.findById(userId).populate('userSecurityData').populate('userBasicData');
  // .populate('userSecurityData', 'username email role_data')
  // .populate('userBasicData', 'firstName lastName')
  // .populate('generalUserStats', 'totalDecks totalCollections totalCardsInCollections');
  contexts?.forEach((context) => {
    const populatePath = getPopulatePathForContext(context);
    query = query?.populate(populatePath);
  });
  const populatedUser = await query?.exec();
  return populatedUser;
}
/**
 * Fetches a populated user document based on the given userId and context.
 * @param {string} userId - The ID of the user.
 * @param {string[]} contextFields - An array of context fields to populate.
 * @returns The populated user document.
 */
async function fetchPopulatedUserContext(userId, contextFields) {
  const populatedUser = await populateUserDataByContext(userId, contextFields);
  if (!populatedUser) {
    throw new Error(`User not found: ${userId}`);
  }
  return populatedUser;
}
/**
 * Finds a specific item within a user's populated context based on its ID.
 * @param {Object} populatedUser - The populated user document.
 * @param {string} contextField - The context field to search within.
 * @param {string} itemId - The ID of the item to find.
 * @returns The found item.
 */
function findUserContextItem(populatedUser, contextField, itemId) {
  if (!populatedUser[contextField]) {
    throw new Error(`Context field ${contextField} not found.`);
  }

  const item = populatedUser[contextField].find((d) => d._id.toString() === itemId);
  if (!item) {
    throw new Error(`${contextField.slice(0, -1)} not found`);
  }
  return item;
}

module.exports = {
  populateUserDataByContext,
  deepPopulateCardFields,
  getPopulatePathForContext,
  fetchPopulatedUserContext,
  findUserContextItem,
};
