const Deck = require('../models/Deck.js');

exports.getDeck = async (req, res) => {
  const deck = await Deck.findById(req.params.deckId);
  res.json(deck);
};

exports.getUserDeck = async (req, res) => {
  const { userId } = req.params;

  try {
    let userDeck = await Deck.findOne({ userId: userId });

    if (!userDeck) {
      userDeck = new Deck({
        userId: userId,
        deck: [],
      });
      await userDeck.save();
    }

    res.status(200).json(userDeck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
};

exports.getAllDecks = async (req, res) => {
  const decks = await Deck.find();
  res.json(decks);
};

exports.updateDeck = async (req, res) => {
  const deck = req.body;

  if (!Array.isArray(deck)) {
    return res.status(400).json({ error: 'Deck must be an array' });
  }
  try {
    let currentDeck = await Deck.findById(req.params.deckId);

    if (currentDeck) {
      // Create a copy of the current deck
      let updatedDeck = [...currentDeck.deck];

      for (let item of deck) {
        const { id } = item;
        const quantity = parseInt(item.quantity);

        const itemIndex = updatedDeck.findIndex(
          (deckItem) => deckItem.id.toString() === id.toString(),
        );

        if (itemIndex > -1) {
          if (item.quantity === 0) {
            updatedDeck.splice(itemIndex, 1);
          } else {
            updatedDeck[itemIndex].quantity = item.quantity;
          }
        } else if (quantity > 0) {
          updatedDeck.push(item);
        }
      }

      // Update the deck
      currentDeck.deck = updatedDeck;

      await currentDeck.save();
      res.json(currentDeck);
    } else {
      res.status(404).json({ error: 'Deck not found.' });
    }
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteItemFromDeck = async (req, res) => {
  let deck = await Deck.findById(req.params.deckId);

  if (deck) {
    deck.deck = deck.deck.filter(
      (item) => item.cardId.toString() !== req.params.cardId,
    );

    await deck.save();
    res.json(deck);
  } else {
    res.status(404).json({ error: 'Deck not found.' });
  }
};

exports.decreaseItemQuantity = async (req, res) => {
  const { deckId } = req.params;
  const { cardId, deckData } = req.body;
  const id = deckData._id;
  try {
    let deck = await Deck.findOne({ _id: id });

    if (deck) {
      let existingDeckItem = deck.deck.find(
        (item) => item.id.toString() === cardId,
      );

      if (existingDeckItem && existingDeckItem.quantity > 0) {
        existingDeckItem.quantity -= 1;
        if (existingDeckItem.quantity === 0) {
          deck.deck = deck.deck.filter(
            (item) => item.id.toString() !== cardId,
          );
        }
      }

      await deck.save();
      res.json(deck);
    } else {
      res.status(404).json({ error: 'Deck not found.' });
    }
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.createOrUpdateDeck = async (req, res) => {
  const { cardId, quantity, userId } = req.body;

  try {
    let deck = await Deck.findOne({ userId: userId });

    if (!deck) {
      deck = new Deck({
        userId: userId,
        deck: [{ cardId, quantity }],
      });
    } else {
      // Check if card already exists in the deck
      let existingDeckItem = deck.deck.find(
        (item) => item && item.cardId && item.cardId.toString() === cardId,
      );

      if (existingDeckItem) {
        existingDeckItem.quantity += quantity; // update the quantity
      } else {
        deck.deck.push({ cardId, quantity });
      }
    }

    await deck.save();
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmptyDeck = async (req, res) => {
  const { userId } = req.body; // Extracting userId from body instead of params

  try {
    let deck = await Deck.findOne({ userId: userId });

    if (!deck) {
      deck = new Deck({
        userId: userId,
        deck: [],
      });

      await deck.save();
    }

    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
