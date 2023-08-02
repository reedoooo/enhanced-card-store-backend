const express = require('express');
const deckController = require('../../controllers/DeckController');

const router = express.Router();

router.get('/:deckId', deckController.getDeck);
router.get('/userDeck/:userId', deckController.getUserDeck);
router.put('/:deckId', deckController.updateDeck);
router.put('/:deckId/decrease', deckController.decreaseItemQuantity);
router.delete('/user/:userId/deck/:deckId', deckController.deleteItemFromDeck);
router.get('/', deckController.getAllDecks);

router.post('/', deckController.createOrUpdateDeck);
router.post('/newDeck/:userId', deckController.createEmptyDeck);

module.exports = router;
