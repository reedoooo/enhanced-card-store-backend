const CustomError = require('../../../middleware/customError');
const { CardInDeck } = require('../../../models/Card');
const { Deck } = require('../../../models/Collection');
const User = require('../../../models/User');
const { populateUserDataByContext } = require('../dataUtils');

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
    const user = await populateUserDataByContext(userId, ['decks']);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      message: 'Fetched all decks successfully',
      data: user.allDecks,
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

    const newDeck = new Deck({ userId, name, description, tags, color, cards });
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
    let user = await populateUserDataByContext(userId, ['decks']);
    const deck = user.allDecks.find((d) => d._id.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    for (const cardId of cards) {
      const deckCard = new CardInDeck({ cardId });
      await deckCard.save();
      deck.cards.push(deckCard._id);
    }

    await deck.save();
    res.status(200).json({ message: 'Cards added to deck successfully', deck });
  } catch (error) {
    next(error);
  }
};
exports.removeCardsFromDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cardIds } = req.body; // Assuming cardIds is an array of card IDs to remove

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    const deck = user.allDecks.find((d) => d._id.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    deck.cards = deck.cards.filter((card) => !cardIds.includes(card.toString()));
    await deck.save();

    res.status(200).json({ message: 'Cards removed from deck successfully', deck });
  } catch (error) {
    next(error);
  }
};
exports.updateCardsInDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cardUpdates } = req.body; // cardUpdates is an array of objects with cardId and updates

  try {
    let user = await populateUserDataByContext(userId, ['decks']);
    const deck = user.allDecks.find((d) => d._id.toString() === deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    for (const update of cardUpdates) {
      const cardIndex = deck.cards.findIndex((card) => card.cardId === update.cardId);
      if (cardIndex !== -1) {
        deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...update };
      }
    }

    await deck.save();
    res.status(200).json({ message: 'Cards updated in deck successfully', deck });
  } catch (error) {
    next(error);
  }
};
// !--------------------------! DECKS !--------------------------!
