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

// async function populateUserDataByContext(userId, context) {
//   try {
//     const populatePath = getPopulatePathForContext(context);
//     return await User.findById(userId)
//       .populate('userSecurityData', 'username email role_data')
//       .populate('userBasicData', 'firstName lastName')
//       .populate(populatePath);
//   } catch (error) {
//     console.error(`Error populating user data for context ${context}:`, error);
//     throw error;
//   }
// }

module.exports = {
  populateUserDataByContext,
};

// const { User } = require('../../models');
// function deepPopulateCardFields() {
//   return [
//     { path: 'card_sets', model: 'CardSet' },
//     {
//       path: 'cardVariants',
//       model: 'CardVariant',
//       populate: [
//         { path: 'set', model: 'CardSet' },
//         { path: 'variant', model: 'CardVariant' },
//       ],
//     },
//   ];
// }
// function deepPopulateDeck() {
//   return {
//     path: 'allDecks',
//     populate: {
//       path: 'cards',
//       model: 'CardInDeck',
//       populate: [
//         { path: 'card_sets', model: 'CardSet' },
//         { path: 'cardVariants', model: 'CardVariant', populate: { path: 'set', model: 'CardSet' } },
//       ],
//     },
//   };
// }
// function deepPopulateCollection() {
//   return {
//     path: 'allCollections',
//     populate: {
//       path: 'cards',
//       model: 'CardInCollection',
//       populate: deepPopulateCardFields(),
//     },
//   };
// }
// function deepPopulateCart() {
//   return {
//     path: 'cart',
//     populate: {
//       path: 'cart',
//       model: 'CardInCart',
//       populate: deepPopulateCardFields(),
//     },
//   };
// }
// /**
//  * Populate the user's data
//  * @param {string} userId
//  * @returns
//  */
// async function populateUserData(userId) {
//   return User.findById(userId)
//     .populate('userSecurityData')
//     .populate('userBasicData')
//     .populate(deepPopulateDeck())
//     .populate(deepPopulateCollection())
//     .populate(deepPopulateCart());
// }
// async function populateUserDecksCollectionsCart(user) {
//   return User.findById(user._id)
//     .populate('userSecurityData', 'username email role_data')
//     .populate('userBasicData', 'firstName lastName')
//     .populate(deepPopulateDeck())
//     .populate(deepPopulateCollection())
//     .populate(deepPopulateCart());
// }

// module.exports = {
//   populateUserData,
//   deepPopulateDeck,
//   deepPopulateCollection,
//   deepPopulateCart,
//   deepPopulateCardFields,
//   populateUserDecksCollectionsCart,
// };
