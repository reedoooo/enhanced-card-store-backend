const Deck = require('../models/Deck.js');

exports.getAllDecksForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const decks = await Deck.find({ userId });
    if (!decks.length) {
      return res.status(404).send({ error: 'No decks found.' });
    }
    res.status(200).send(decks);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.updateDeck = async (req, res) => {
  try {
    const deckId = req.params.deckId;
    const updatedFields = req.body;

    const updatedDeck = await Deck.findByIdAndUpdate(deckId, updatedFields, {
      new: true,
    });
    if (!updatedDeck) {
      return res.status(404).send({ error: 'Deck not found.' });
    }
    res.status(200).send(updatedDeck);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.deleteItemFromDeck = async (req, res) => {
  try {
    const deckId = req.params.deckId;
    const deletedDeck = await Deck.findByIdAndDelete(deckId);
    if (!deletedDeck) {
      return res.status(404).send({ error: 'Deck not found.' });
    }
    res.status(200).send(deletedDeck);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.createEmptyDeck = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, description, cards } = req.body;

    const newDeck = new Deck({
      userId,
      name,
      description,
      cards,
    });

    await newDeck.save();
    res.status(201).send(newDeck);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.decreaseItemQuantity = async (req, res) => {
  const { deckId } = req.params;
  const { cardId } = req.body;

  try {
    let deck = await Deck.findById(deckId);

    if (deck) {
      let existingCard = deck.cards.find(
        (item) => item.id.toString() === cardId,
      );

      if (existingCard && existingCard.quantity > 0) {
        existingCard.quantity -= 1;
        if (existingCard.quantity === 0) {
          deck.cards = deck.cards.filter(
            (item) => item.id.toString() !== cardId,
          );
        }
      }

      await deck.save();
      res.status(200).json(deck);
    } else {
      res.status(404).send({ error: 'Deck not found.' });
    }
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.createOrUpdateDeck = async (req, res) => {
  const { cardData, userId } = req.body; // Assuming cardData contains all the fields for a CardInDeck

  try {
    let deck = await Deck.findOne({ userId });

    if (!deck) {
      deck = new Deck({
        userId,
        cards: [cardData],
      });
    } else {
      let existingCard = deck.cards.find(
        (item) => item.id.toString() === cardData.id,
      );

      if (existingCard) {
        Object.assign(existingCard, cardData);
      } else {
        deck.cards.push(cardData);
      }
    }

    await deck.save();
    res.status(200).json(deck);
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

exports.getAllDecks = async (req, res) => {
  try {
    const decks = await Deck.find({});
    res.status(200).json(decks);
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// const Deck = require('../models/Deck.js');

// exports.getAllDecksForUser = async (req, res, next) => {
//   try {
//     const userId = req.params.userId;
//     const decks = await Deck.find({ userId });
//     if (decks.length === 0) {
//       return res.status(404).send({ error: 'No decks found.' });
//     }
//     res.send(decks);
//   } catch (err) {
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
//   // const { userId } = req.params;
//   // console.log('USERID RECEIVED:', userId);
//   // try {
//   //   const userDecks = await Deck.find({ userId: userId }); // Directly query MongoDB
//   //   res.status(200).json(userDecks);
//   // } catch (error) {
//   //   console.error(error);
//   //   res.status(500).json({ error: error.toString() });
//   // }
// };

// exports.updateDeck = async (req, res, next) => {
//   try {
//     const deckId = req.params.deckId;
//     const updatedFields = req.body;

//     const updatedDeck = await Deck.findByIdAndUpdate(deckId, updatedFields, {
//       new: true,
//     });
//     if (!updatedDeck) {
//       return res.status(404).send({ error: 'Deck not found.' });
//     }

//     res.send(updatedDeck);
//   } catch (err) {
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };

// exports.deleteItemFromDeck = async (req, res) => {
//   try {
//     const deckId = req.params.deckId;

//     const deletedDeck = await Deck.findByIdAndDelete(deckId);
//     if (!deletedDeck) {
//       return res.status(404).send({ error: 'Deck not found.' });
//     }

//     res.send(deletedDeck);
//   } catch (err) {
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };

// exports.createEmptyDeck = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const { name, description, cards } = req.body;

//     const newDeck = new Deck({
//       userId,
//       name,
//       description,
//       cards,
//     });

//     await newDeck.save();
//     res.status(201).send(newDeck);
//   } catch (err) {
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };

// exports.decreaseItemQuantity = async (req, res) => {
//   const { deckId } = req.params;
//   const { cardId } = req.body;

//   try {
//     let deck = await Deck.findById(deckId);

//     if (deck) {
//       let existingCard = deck.cards.find(
//         (item) => item.id.toString() === cardId,
//       );

//       if (existingCard && existingCard.quantity > 0) {
//         existingCard.quantity -= 1;
//         if (existingCard.quantity === 0) {
//           deck.cards = deck.cards.filter(
//             (item) => item.id.toString() !== cardId,
//           );
//         }
//       }

//       await deck.save();
//       res.json(deck);
//     } else {
//       res.status(404).json({ error: 'Deck not found.' });
//     }
//   } catch (error) {
//     console.error(error.stack);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.createOrUpdateDeck = async (req, res) => {
//   const { cardData, userId } = req.body; // Assuming cardData contains all the fields for a CardInDeck

//   try {
//     let deck = await Deck.findOne({ userId: userId });

//     if (!deck) {
//       deck = new Deck({
//         userId: userId,
//         cards: [cardData],
//       });
//     } else {
//       let existingCard = deck.cards.find(
//         (item) => item && item.id && item.id.toString() === cardData.id,
//       );

//       if (existingCard) {
//         existingCard = { ...existingCard, ...cardData };
//       } else {
//         deck.cards.push(cardData);
//       }
//     }

//     await deck.save();
//     res.json(deck);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // exports.getDeck = async (req, res) => {
// //   const deck = await Deck.findById(req.params.deckId);
// //   res.json(deck);
// // };

// // exports.getUserDeck = async (req, res) => {
// //   const { userId } = req.params;
// //   console.log('userId:', userId);
// //   try {
// //     let userDeck = await Deck.findOne({ userId: userId });

// //     if (!userDeck) {
// //       userDeck = new Deck({
// //         userId: userId,
// //         cards: [],
// //       });
// //       await userDeck.save();
// //     }

// //     res.status(200).json(userDeck);
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: error.toString() });
// //   }
// // };

// exports.getAllDecks = async (req, res, next) => {
//   try {
//     const decks = await Deck.find({});
//     res.status(200).json(decks);
//   } catch (error) {
//     next(error);
//   }
// };
