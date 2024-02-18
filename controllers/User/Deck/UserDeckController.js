const CustomError = require('../../../middleware/customError');
const { CardInDeck } = require('../../../models/Card');
const { Deck } = require('../../../models/Collection');
const User = require('../../../models/User');
const { populateUserDataByContext } = require('../dataUtils');
const { reFetchForSave } = require('../helpers');

/**
 * Gets a default card for a deck.
 * @returns {Promise<mongoose.Document>} A promise that resolves to a card document.
 */
async function getDefaultCardForDeck() {
  try {
    // Define the default card name (or any other criteria)
    const defaultCardName = 'Blue-Eyes White Dragon';

    // Fetch the card from the database
    let card = await CardInDeck.findOne({ name: defaultCardName });

    // If the card doesn't exist, handle it (e.g., create a new card, throw an error, etc.)
    if (!card) {
      // Option 1: Create a new card (assuming a createCard function exists)
      // card = await createCard({ name: defaultCardName, ...otherProperties });

      // Option 2: Throw an error
      throw new Error(`Default card '${defaultCardName}' not found`);
    }

    return card;
  } catch (error) {
    console.error('Error fetching the default card for the deck:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

// !--------------------------! DECKS !--------------------------!
exports.getAllDecksForUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const populatedUser = await populateUserDataByContext(userId, ['decks']);
    if (!populatedUser) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      message: `Fetched decks for user ${userId}`,
      data: populatedUser.allDecks,
    });
  } catch (error) {
    next(error);
  }
};

// exports.updateAndSyncDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const updatedDeckData = req.body;

//   try {
//     let user = await User.findById(userId)
//       .populate('userSecurityData', 'username email role_data')
//       .populate('userBasicData', 'firstName lastName')
//       .populate({
//         path: 'allDecks',
//         populate: {
//           path: 'cards',
//           model: 'CardInDeck',
//           populate: [
//             { path: 'card_sets', model: 'CardSet' },
//             { path: 'cardVariants', model: 'CardVariant' },
//           ],
//         },
//       });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     const deck = user.allDecks.find((deck) => deck._id.toString() === deckId);
//     if (!deck) {
//       return res.status(404).json({ message: 'Deck not found.' });
//     }

//     // Update deck with new data
//     Object.assign(deck, updatedDeckData);

//     await deck.save(); // Save the updated deck

//     user = await user.populate({
//       path: 'allDecks',
//       populate: {
//         path: 'cards',
//         model: 'CardInDeck',
//       },
//     });
//     res.status(200).json({ message: 'Deck updated successfully.', allDecks: user.allDecks });
//   } catch (error) {
//     next(error);
//   }
// };
exports.updateAndSyncDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const updatedDeckData = req.body;

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    const deck = user.allDecks.find((d) => d._id.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found.' });

    Object.assign(deck, updatedDeckData);
    await deck.save();

    res.status(200).json({ message: 'Deck updated successfully.', deck });
  } catch (error) {
    next(error);
  }
};
exports.updateDeckDetails = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { name, description, tags, color } = req.body;

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    const deck = user.allDecks.find((d) => d._id.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found.' });

    Object.assign(deck, { name, description, tags, color });
    await deck.save();

    res.status(200).json({ message: 'Deck updated successfully.', deck });
  } catch (error) {
    next(error);
  }
};
exports.createNewDeck = async (req, res, next) => {
  const { userId } = req.params;
  const { name, description, tags, color, cards } = req.body;

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    if (user.allDecks.some((d) => d.name === name)) {
      return res.status(400).json({ message: 'Deck with this name already exists' });
    }
    const collectionModel = 'Deck';
    const newDeck = new Deck({ userId, name, description, tags, color, cards, collectionModel });
    await newDeck.save();
    user.allDecks.push(newDeck._id);
    await user.save();

    res.status(201).json({ message: 'New deck created successfully', deck: newDeck });
  } catch (error) {
    next(error);
  }
};
exports.deleteDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    const deckIndex = user.allDecks.findIndex((d) => d._id.toString() === deckId);
    if (deckIndex === -1) return res.status(404).json({ message: 'Deck not found' });

    user.allDecks.splice(deckIndex, 1);
    await user.save();

    res.status(200).json({ message: 'Deck deleted successfully', deletedDeckId: deckId });
  } catch (error) {
    next(error);
  }
};
exports.addCardsToDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards } = req.body;

  try {
    const populatedUser = await populateUserDataByContext(userId, ['decks']);
    const deck = populatedUser.allDecks.find((d) => d._id?.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    for (const card of cards) {
      // const existingCard = await CardInDeck.findOne({ _id: card._id, deckId });
      let cardInDeck = deck.cards.find((c) => c.cardId?.toString() === card.id);
      if (cardInDeck) {
        console.log('Updating existing card:', cardInDeck.name.blue);

        cardInDeck.quantity += card.quantity;
        await cardInDeck.save();

        // Update deck's total quantity and price
        deck.totalQuantity += card.quantity;
        deck.totalPrice += card.quantity * cardInDeck.price;
      } else {
        if (!card) {
          throw new CustomError('Card not provided in request body');
        }
        const reSavedCard = await reFetchForSave(card, deckId, 'Deck', 'CardInDeck');
        console.log('Re-saved card:', reSavedCard);
        // await newCard.save();
        deck.cards.push(reSavedCard?._id);
      }
    }

    await deck.save();

    await populatedUser.save();

    await deck.populate({
      path: 'cards',
      model: 'CardInDeck',
    });
    const uniqueCardsMap = new Map();
    deck.cards.forEach((card) => uniqueCardsMap.set(card._id.toString(), card));
    deck.cards = Array.from(uniqueCardsMap.values());

    res
      .status(200)
      .json({ message: 'Cards added to deck successfully', data: { deck, user: populatedUser } });
  } catch (error) {
    next(error);
  }
};
exports.removeCardsFromDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards } = req.body;

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    const deck = user.allDecks.find((d) => d._id.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    // Remove cards from the deck and also delete them from the CardInDeck model
    for (const card of cards) {
      console.log('Removing card:', card.name.blue);
      const cardIds = cards.map((c) => c._id);
      await CardInDeck.deleteMany({ deckId, cardId: { $in: cardIds } });
      deck.cards = deck.cards.filter((card) => !cardIds.includes(card.toString()));
    }
    await deck.save();
    res.status(200).json({ message: 'Cards removed from deck successfully', deck });
  } catch (error) {
    next(error);
  }
};
// exports.removeCardsFromDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const { cards } = req.body;

//   if (!Array.isArray(cards)) {
//     return res.status(400).json({ message: 'Invalid card data, expected an array.' });
//   }

//   try {
//     let populatedUser = await populateUserDataByContext(userId, ['decks']);

//     const deck = populatedUser.allDecks.find(
//       (d) => d._id.toString() === deckId
//     );

//     if (!deck) {
//       return res.status(404).json({ message: 'Deck not found.' });
//     }

//     // Remove specified cards
//     const cardIdsToRemove = cards.map((c) => c._id);
//     deck.cards = deck.cards.filter((card) => !cardIdsToRemove.includes(card.id));

//     // Now, you'll have to remove these cards from the CardInDeck model as well
//     await CardInDeck.deleteMany({ _id: { $in: cardIdsToRemove }, deckId });

//     await deck.save();

//     await populatedUser.save();

//     populatedUser = await populateUserDataByContext(userId, ['decks']);

//     // return the updated deck from the populated user
//     const updatedDeck = populatedUser.allDecks.find(
//       (d) => d._id.toString() === deckId
//     );

//     res
//       .status(200)
//       .json({ message: 'Cards updated in deck successfully.', data: updatedDeck });
//   } catch (error) {
//     console.error('Error updating deck:', error);
//     next(error);
//   }
// };

/**
 * Updates the cards in a deck and returns the updated deck data.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
exports.updateCardsInDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards, type } = req.body;

  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    const populatedUser = await populateUserDataByContext(userId, ['decks']);
    const deck = populatedUser?.allDecks.find((d) => d._id.toString() === deckId);

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found.' });
    }

    for (const cardData of cards) {
      const cardInDeck = await CardInDeck.findById(cardData?._id); // Assuming CardInDeck is a model

      if (cardInDeck) {
        console.log('Updating existing card:', cardInDeck.name.blue);
        // set the card's quantity to the updated quantity
        if (cardInDeck.quantity !== cardData.quantity) {
          console.log('Updating card quantity');
          cardInDeck.quantity = cardData.quantity;
        }
        if (type === 'increment') {
          console.log('Incrementing card quantity');
          cardInDeck.quantity += 1;
        }
        if (type === 'decrement') {
          console.log('Decrementing card quantity');
          cardInDeck.quantity -= 1;
        }
        console.log('Card quantity:', cardInDeck.quantity);

        // Save the card with pre-save hooks
        await cardInDeck.save();

        // Update collection's total quantity and price
        deck.totalQuantity += cardInDeck.quantity;
        deck.totalPrice += cardInDeck.quantity * cardInDeck.price;

        // Update the card's contextual quantities and prices
      } else {
        console.log(`Card not found in deck: ${cardInDeck._id}`.red);
      }
    }

    await deck.save();

    await populatedUser.save();

    // Repopulate the deck
    await deck.populate({
      path: 'cards',
      model: 'CardInDeck', // Assuming this is the model for cards in a deck
      // populate: deepPopulateCardFields(), // If needed
    });

    res.status(200).json({ message: 'Cards updated in deck successfully.', data: deck });
  } catch (error) {
    console.error('Error updating cards in deck:', error);
    next(error);
  }
};

// exports.updateCardsInDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const { cards } = req.body;

//   try {
//     let user = await populateUserDataByContext(userId, ['decks']);
//     const deck = user.allDecks.find((d) => d._id?.toString() === deckId);
//     if (!deck) return res.status(404).json({ message: 'Deck not found' });

//     for (const update of cards) {
//       const card = await CardInDeck.findOne({ cardId: update.cardId, deckId });
//       if (card) {
//         Object.assign(card, update); // Merge updates into the card
//         await card.save();
//       }
//     }

//     await deck.save();
//     res.status(200).json({ message: 'Cards updated in deck successfully', deck });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.addCardsToDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const { cards } = req.body;

//   try {
//     let user = await populateUserDataByContext(userId, ['decks']);
//     const deck = user.allDecks.find((d) => d._id.toString() === deckId);
//     if (!deck) return res.status(404).json({ message: 'Deck not found' });

//     for (const cardId of cards) {
//       const deckCard = new CardInDeck({ cardId });
//       await deckCard.save();
//       deck.cards.push(deckCard._id);
//     }

//     await deck.save();
//     res.status(200).json({ message: 'Cards added to deck successfully', deck });
//   } catch (error) {
//     next(error);
//   }
// };
// exports.removeCardsFromDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const { cardIds } = req.body; // Assuming cardIds is an array of card IDs to remove

//   try {
//     let user = await populateUserDataByContext(userId, ['decks']);
//     const deck = user.allDecks.find((d) => d._id.toString() === deckId);
//     if (!deck) return res.status(404).json({ message: 'Deck not found' });

//     deck.cards = deck.cards.filter((card) => !cardIds.includes(card.toString()));
//     await deck.save();

//     res.status(200).json({ message: 'Cards removed from deck successfully', deck });
//   } catch (error) {
//     next(error);
//   }
// };
// exports.updateCardsInDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const { cardUpdates } = req.body; // cardUpdates is an array of objects with cardId and updates

//   try {
//     let user = await populateUserDataByContext(userId, ['decks']);
//     const deck = user.allDecks.find((d) => d._id.toString() === deckId);
//     if (!deck) return res.status(404).json({ message: 'Deck not found' });

//     for (const update of cardUpdates) {
//       const cardIndex = deck.cards.findIndex((card) => card.cardId === update.cardId);
//       if (cardIndex !== -1) {
//         deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...update };
//       }
//     }

//     await deck.save();
//     res.status(200).json({ message: 'Cards updated in deck successfully', deck });
//   } catch (error) {
//     next(error);
//   }
// };
// !--------------------------! DECKS !--------------------------!
