const { fetchPopulatedUserContext } = require('./utils/dataUtils');
const { addOrUpdateCards, removeCards } = require('./utils/helpers');
const { sendJsonResponse } = require('../utils/utils');
const { validateContextEntityExists } = require('../middleware/errorHandling/validators');
const logger = require('../configs/winston');
const { Deck } = require('../models');
const { CardInDeck } = require('../models/Card');
// !--------------------------! DECKS !--------------------------!
const findUserDeck = (user, deckId) =>
  user.allDecks.find((d) => d.id.toString() === deckId.toString());
exports.getAllDecksForUser = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  validateContextEntityExists(populatedUser, 'User not found', 404, res);
  sendJsonResponse(res, 200, `Fetched decks for user ${req.params.userId}`, populatedUser.allDecks);
};
exports.getDeckById = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  const deck = findUserDeck(populatedUser, req.params.deckId);
  validateContextEntityExists(deck, 'Deck not found', 404, res);
  sendJsonResponse(res, 200, `Fetched deck for user ${req.params.userId}`, deck);
};
exports.updateDeckDetails = async (req, res, next) => {
  const { name, description, tags, color } = req.body;
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  const deck = findUserDeck(populatedUser, req.params.deckId);
  validateContextEntityExists(deck, 'Deck not found', 404, res);
  Object.assign(deck, { name, description, tags, color });
  await deck.save();
  logger.info(deck);
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
    userId,
    name,
    description,
    tags: tags || ['default'],
    color: color || 'blue',
    cards,
    collectionModel: 'Deck',
  });
  await newDeck.save();
  user.allDecks.push(newDeck._id);
  await user.save();

  sendJsonResponse(res, 201, 'New deck created successfully', { data: newDeck });
};
exports.deleteDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;

  const user = await fetchPopulatedUserContext(userId, ['decks']);
  const deckIndex = user.allDecks.findIndex((d) => d._id.toString() === deckId);
  validateContextEntityExists(deckIndex !== -1, 'Deck not found', 404, res);

  user.allDecks.splice(deckIndex, 1);
  await user.save();

  sendJsonResponse(res, 200, 'Deck deleted successfully', {
    data: deckId,
  });
};
exports.addCardsToDeck = async (req, res, next) => {
  let cardsArray = [];
  !Array.isArray(req.body.cards)
    ? cardsArray.push(req.body.cards)
    : logger.info('Cards array received:', cardsArray);

  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['decks']);
  const deck = findUserDeck(populatedUser, req.params.deckId);
  const updatedDeck = await addOrUpdateCards(
    deck,
    cardsArray,
    req.params.deckId,
    'Deck',
    CardInDeck,
  );
  // logger.info(
  //   `Cards added to deck ${req.params.deckId} successfully. ${updatedDeck?.cards?.find((c) => c.id?.toString() === cardsArray[0]?.id?.toString())}`,
  // );
  await updatedDeck.save();
  await populatedUser.save();
  sendJsonResponse(res, 200, 'Cards added to deck successfully.', {
    data: updatedDeck,
  });
};
exports.removeCardsFromDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards } = req.body;

  const populatedUser = await fetchPopulatedUserContext(userId, ['decks']);
  const deck = findUserDeck(populatedUser, deckId);
  validateContextEntityExists(deck, 'Deck not found', 404, res);
  await removeCards(deck, deck._id, cards, 'deck', CardInDeck);
  sendJsonResponse(res, 200, 'Cards removed from deck successfully.', {
    data: deck,
  });
};
// !--------------------------! DECKS !--------------------------!
