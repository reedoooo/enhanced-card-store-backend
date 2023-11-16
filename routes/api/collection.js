const express = require('express');
const collectionController = require('../../controllers/CollectionController');

const router = express.Router();

// GET all decks
router.get('/', collectionController.getAllCollections);

// GET all decks for a specific user
router.get('/:userId', collectionController.getAllCollectionsForUser);

// PUT update a specific deck by deckId
// router.put('/:collectionId', collectionController.updateCollection);

// POST create a new empty deck for a specific user
// router.post('/newCollection/:userId', collectionController.createEmptyCollection);

// DELETE delete a specific deck for a specific user
router.delete(
  '/user/:userId/collection/:collectionId',
  collectionController.deleteItemFromCollection,
);

// router.get('/update/:itemType/:itemId', collectionController.updateSpecificItem);
router.post('/collections/:userId', validateObjectId, collectionController.createNewCollection);
router.get('/collections/:userId', validateObjectId, collectionController.getAllCollectionsForUser);
router.put(
  '/collections/:userId/:collectionId',
  validateObjectId,
  collectionController.updateAndSyncCollection,
);
// Uncomment if you need to decrease item quantity
// router.put('/:deckId/decrease', collectionController.updateAndSyncCollection);

// Uncomment if you need to create or update a deck (not just an empty one)
// router.post('/', deckController.createOrUpdateDeck);

module.exports = router;
