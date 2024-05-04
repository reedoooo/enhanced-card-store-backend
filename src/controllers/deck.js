const { fetchPopulatedUserContext } = require('./utils/dataUtils');
const { addOrUpdateCards, removeCards } = require('./utils/helpers');
const { sendJsonResponse } = require('../utils/utils');
const { validateEntityPresence } = require('../middleware/errorHandling/validators');
const logger = require('../configs/winston');
const { Deck } = require('../models');
const { CardInDeck } = require('../models/Card');
const { v4: uuidv4 } = require('uuid');
// !--------------------------! DECKS !--------------------------!
const findUserDeck = (user, deckId) =>
  user.allDecks.find((d) => d.id.toString() === deckId.toString());
exports.getAllDecksForUser = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  validateEntityPresence(populatedUser, 'User not found', 404, res);
  sendJsonResponse(res, 200, `Fetched decks for user ${req.params.userId}`, populatedUser.allDecks);
};
exports.getDeckById = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  const deck = findUserDeck(populatedUser, req.params.deckId);
  validateEntityPresence(deck, 'Deck not found', 404, res);
  sendJsonResponse(res, 200, `Fetched deck for user ${req.params.userId}`, deck);
};
exports.updateDeckDetails = async (req, res, next) => {
  const { name, description, tags, color } = req.body;
  const parsedTags = JSON.stringify(tags);
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  const deck = findUserDeck(populatedUser, req.params.deckId);
  validateEntityPresence(deck, 'Deck not found', 404, res);
  deck.tags = tags;
  Object.assign(deck, { name, description, parsedTags, color });
  await deck.save();
  await populatedUser.save();
  sendJsonResponse(res, 200, `Deck updated successfully.`, deck);
};
exports.createNewDeck = async (req, res, next) => {
  const { userId } = req.params;
  const { name, description, tags, color, cards } = req.body;
  const user = await fetchPopulatedUserContext(userId, ['decks']);
  if (user.allDecks.some((d) => d.name === name)) {
    return sendJsonResponse(res, 400, 'Deck with this name already exists', {
      error: 'Deck with this name already exists',
    });
  }
  const newDeck = new Deck({
    userId: userId,
    name: name || 'New Deck',
    description: description || 'New deck description',
    tags: tags || [{ id: uuidv4(), label: 'newDeckTag' }],
    color: color || 'blue',
    cards: cards || [],
    collectionModel: 'Deck',
  });
  await newDeck.save();
  user.allDecks.push(newDeck._id);
  await user.save();

  sendJsonResponse(res, 201, 'New deck created successfully', { data: newDeck });
};
exports.deleteDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  try {
    const user = await fetchPopulatedUserContext(userId, ['decks']);
    const deckIndex = user.allDecks.findIndex((d) => d._id.toString() === deckId);
    // validateEntityPresence(deckIndex !== -1, 'Deck not found', 404, res);

    user.allDecks.splice(deckIndex, 1);
    await user.save();

    sendJsonResponse(res, 200, 'Deck deleted successfully', {
      data: deckId,
    });
  } catch (error) {
    logger.error('Error deleting deck:', error);
    next(error);
  }
};
exports.addCardsToDeck = async (req, res, next) => {
  const { cards, type } = req.body;

  const cardsArray = Array.isArray(cards) ? cards : [cards];
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  const deck = findUserDeck(populatedUser, req.params.deckId);
  const updatedDeck = await addOrUpdateCards(
    deck,
    cardsArray,
    req.params.deckId,
    'Deck',
    // CardInDeck,
    'CardInDeck',
    type,
    populatedUser._id,
    CardInDeck,
  );
  await updatedDeck.save();
  await populatedUser.save();
  sendJsonResponse(res, 200, 'Cards added to deck successfully.', {
    data: updatedDeck,
  });
};
exports.removeCardsFromDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards, type } = req.body;

  const populatedUser = await fetchPopulatedUserContext(userId, ['decks']);
  const deck = findUserDeck(populatedUser, deckId);
  const validId = deck.cards.find((c) => c.id === cards)._id;
  validateEntityPresence(deck, 'Deck not found', 404, res);
  await removeCards(deck, deck._id, cards[0], 'deck', CardInDeck, type, populatedUser._id, validId);
  sendJsonResponse(res, 200, 'Cards removed from deck successfully.', {
    data: deck,
  });
};
// !--------------------------! DECKS !--------------------------!
