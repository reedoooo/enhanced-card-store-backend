// !--------------------------! COLLECTIONS !--------------------------!
const { CardInCollection } = require('../../../models/Card');
const { Collection } = require('../../../models/Collection');
const User = require('../../../models/User');
const { getDefaultCardForContext } = require('../helpers');

// COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE)
exports.getAllCollectionsForUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    let user = await User.findById(userId)
      .populate('userSecurityData', 'username email role_data')
      .populate('userBasicData', 'firstName lastName')
      .populate({
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: [
            { path: 'card_sets', model: 'CardSet' },
            { path: 'cardVariants', model: 'CardVariant' },
          ],
        },
      });
    // Populate user data and send response

    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('USER', user?.allCollections[0]?.cards);

    res.status(200).json({
      message: `Fetched collections for user ${userId}`,
      data: user.allCollections,
    });
  } catch (error) {
    console.error('Error fetching collections', { error });
    next(error);
  }
};
exports.createNewCollection = async (req, res, next) => {
  const { userId } = req.params;
  const newCollectionData = req.body; // Assume the body contains new collection details

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cardsData = newCollectionData.cards || [];

    const newCollection = new Collection({
      userId,
      name: newCollectionData.name,
      description: newCollectionData.description,
      cards: [],
      totalQuantity: 0,
      totalPrice: 0,
    });

    for (const cardData of cardsData) {
      // const newCard = new CardInCollection({
      //   cardModel: 'CardInCollection', // Adjust according to your schema
      //   refId: cardInContext._id,
      //   collectionModel: 'Collection', // Adjust according to your schema
      //   collectionId: newCollection._id,
      // });
      const newCard = getDefaultCardForContext('Collection');

      // Assuming price and quantity fields are part of cardData
      newCollection.totalQuantity += cardData.quantity || 0;
      newCollection.totalPrice += (cardData.price || 0) * (cardData.quantity || 0);

      await newCard.save();
      newCollection.cards.push(newCard._id);
    }

    await newCollection.save();
    user.allCollections.push(newCollection._id);
    await user.save();

    res.status(201).json({
      message: 'New collection created successfully',
      data: newCollection,
    });
  } catch (error) {
    console.error('Error in createNewCollection', error);
    next(error);
  }
};
exports.updateAndSyncCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const updatedCollectionData = req.body; // Assume this contains the updated details for the collection and cards

  try {
    let user = await User.findById(userId)
      .populate('userSecurityData', 'username email role_data')
      .populate('userBasicData', 'firstName lastName')
      .populate({
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: [
            { path: 'card_sets', model: 'CardSet' },
            { path: 'cardVariants', model: 'CardVariant' },
          ],
        },
      });
    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Update collection details
    Object.assign(collection, updatedCollectionData);
    collection.totalQuantity = 0;
    collection.totalPrice = 0;

    for (const cardData of collection.cards) {
      const cardVariant = await CardInCollection.findById(cardData.cardVariant._id);
      if (cardVariant) {
        // Update cardVariant fields as necessary based on cardData
        await cardVariant.save();

        collection.totalQuantity += cardData.quantity; // Update this based on your schema
        collection.totalPrice += cardData.price; // Update this based on your schema
      }
    }

    await collection.save();

    res.status(200).json({
      message: 'Collection updated successfully',
      collectionData: collection, // This now includes updated cards
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    next(error);
  }
};
exports.deleteCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;

  try {
    let user = await User.findById(userId)
      .populate('userSecurityData', 'username email role_data')
      .populate('userBasicData', 'firstName lastName')
      .populate({
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: [
            { path: 'card_sets', model: 'CardSet' },
            { path: 'cardVariants', model: 'CardVariant' },
          ],
        },
      });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove the collection from the user's collections
    user.allCollections = user.allCollections.filter((c) => c._id.toString() !== collectionId);
    await user.save();

    // Optionally, you might want to delete the collection from the Collection model as well
    await Collection.findByIdAndDelete(collectionId);

    res
      .status(200)
      .json({ message: 'Collection deleted successfully', deletedCollectionId: collectionId });
  } catch (error) {
    console.error('Error deleting collection:', error);
    next(error);
  }
};

// COLLECTION ROUTES: CHARTS-IN-COLLECTION ROUTES (UPDATE)
exports.updateChartDataInCollection = async (req, res, next) => {
  const { collectionId } = req.params;
  const updatedChartData = req.body.allXYValues;

  try {
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Update the chart data
    collection.chartData.allXYValues = updatedChartData;
    await collection.save();

    return res.status(200).json({
      chartMessage: 'Chart data updated successfully',
      allXYValues: collection.chartData.allXYValues,
    });
  } catch (error) {
    console.error('Error updating chart data in collection:', error);
    next(error);
  }
};

// COLLECTION ROUTES: CARDS-IN-COLLECTION Routes (GET, CREATE, UPDATE, DELETE)
exports.addCardsToCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    let user = await User.findById(userId)
      .populate('userSecurityData', 'username email role_data')
      .populate('userBasicData', 'firstName lastName')
      .populate({
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: [
            { path: 'card_sets', model: 'CardSet' },
            { path: 'cardVariants', model: 'CardVariant' },
          ],
        },
      });

    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    for (const cardData of cards) {
      const existingCard = collection.cards.find((card) => card._id.toString() === cardData._id);

      if (existingCard) {
        // Update existing card
        existingCard.quantity += cardData.quantity;
        existingCard.totalPrice = existingCard.quantity * existingCard.price; // Adjust if price is stored differently
      } else {
        // Add new card
        const newCard = new CardInCollection({ cardData: cardData, collectionId: collection._id });
        await newCard.save();
        collection.cards.push(newCard);
      }
    }

    await collection.save();

    await user.save();

    // Repopulate the collection
    await collection.populate({
      path: 'cards',
      model: 'CardInCollection',
    });
    res.status(200).json({ message: 'Cards added to collection successfully.', collection });
  } catch (error) {
    console.error('Error adding cards to collection:', error);
    next(error);
  }
};
exports.removeCardsFromCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    let user = await User.findById(userId)
      .populate('userSecurityData', 'username email role_data')
      .populate('userBasicData', 'firstName lastName')
      .populate({
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: [
            { path: 'card_sets', model: 'CardSet' },
            { path: 'cardVariants', model: 'CardVariant' },
          ],
        },
      });
    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    collection.cards = collection.cards.filter((card) => !cards.some((c) => c.id === card.id));

    await collection.save();

    await user.save();

    // Repopulate the collection
    await collection.populate({
      path: 'cards',
      model: 'CardInCollection',
    });
    res.status(200).json({ message: 'Cards removed from collection successfully.', collection });
  } catch (error) {
    console.error('Error removing cards from collection:', error);
    next(error);
  }
};
exports.updateCardsInCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    let user = await User.findById(userId)
      .populate('userSecurityData', 'username email role_data')
      .populate('userBasicData', 'firstName lastName')
      .populate({
        path: 'allCollections',
        populate: {
          path: 'cards',
          model: 'CardInCollection',
          populate: [
            { path: 'card_sets', model: 'CardSet' },
            { path: 'cardVariants', model: 'CardVariant' },
          ],
        },
      });
    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    for (const update of cards) {
      const cardIndex = collection.cards.findIndex((card) => card.id === update.id);
      if (cardIndex > -1) {
        const card = collection.cards[cardIndex];
        // Update card details here, like quantity, price, etc.
        card.quantity = update.quantity;
        card.totalPrice = update.quantity * card.price; // Assuming price is part of the card details
        // Save individual card updates if necessary
      } else {
        // add a new card
        // Save the new card
        // Add the new card to the collection
        // Save the collection
        // Repopulate the collection
        // Return the updated collection
      }
    }

    await collection.save();

    await user.save();

    // Repopulate the collection
    await collection.populate({
      path: 'cards',
      model: 'CardInCollection',
    });
    res.status(200).json({ message: 'Cards updated in collection successfully.', collection });
  } catch (error) {
    console.error('Error updating cards in collection:', error);
    next(error);
  }
};
// !--------------------------! COLLECTIONS !--------------------------!
