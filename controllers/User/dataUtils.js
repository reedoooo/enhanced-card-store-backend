const { User } = require('../../models');

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
  ];
}

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
          path: 'cart',
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
  if (!Array.isArray(contexts) || contexts.length === 0) {
    throw new Error('Contexts must be a non-empty array');
  }

  let query = User.findById(userId)
    .populate('userSecurityData', 'username email role_data')
    .populate('userBasicData', 'firstName lastName');

  contexts.forEach((context) => {
    const populatePath = getPopulatePathForContext(context);
    query = query.populate(populatePath);
  });

  try {
    return await query;
  } catch (error) {
    console.error('Error populating user data:', error);
    throw error;
  }
}

module.exports = {
  populateUserDataByContext,
  deepPopulateCardFields,
};
