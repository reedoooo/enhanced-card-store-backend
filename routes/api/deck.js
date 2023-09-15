const express = require('express');
const deckController = require('../../controllers/DeckController');

const router = express.Router();

// GET all decks
router.get('/', deckController.getAllDecks);

// GET all decks for a specific user
router.get('/:userId', deckController.getAllDecksForUser);

// PUT update a specific deck by deckId
router.put('/:deckId', deckController.updateDeck);

// POST create a new empty deck for a specific user
router.post('/newDeck/:userId', deckController.createEmptyDeck);

// DELETE delete a specific deck for a specific user
router.delete('/user/:userId/deck/:deckId', deckController.deleteItemFromDeck);

// Uncomment if you need to decrease item quantity
// router.put('/:deckId/decrease', deckController.decreaseItemQuantity);

// Uncomment if you need to create or update a deck (not just an empty one)
// router.post('/', deckController.createOrUpdateDeck);

module.exports = router;
