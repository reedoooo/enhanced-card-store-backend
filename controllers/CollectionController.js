const { Collection } = require('../models/Collection.js');

// Get all collections for a specific user
exports.getAllCollectionsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const collections = await Collection.find({ userId });
    if (!collections.length) {
      return res.status(404).send({ error: 'No collections found.' });
    }
    res.status(200).send(collections);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// Update a specific collection
exports.updateCollection = async (req, res) => {
  try {
    const collectionId = req.params.collectionId;
    const updatedFields = req.body;
    const updatedCollection = await Collection.findByIdAndUpdate(collectionId, updatedFields, {
      new: true,
    });
    if (!updatedCollection) {
      return res.status(404).send({ error: 'Collection not found.' });
    }
    res.status(200).send(updatedCollection);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// Delete a specific item from a collection
exports.deleteItemFromCollection = async (req, res) => {
  try {
    const collectionId = req.params.collectionId;
    const deletedCollection = await Collection.findByIdAndDelete(collectionId);
    if (!deletedCollection) {
      return res.status(404).send({ error: 'Collection not found.' });
    }
    res.status(200).send(deletedCollection);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// Create an empty collection
exports.createEmptyCollection = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, description, items } = req.body;
    const newCollection = new Collection({
      userId,
      name,
      description,
      items,
    });
    await newCollection.save();
    res.status(201).send(newCollection);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// Decrease item quantity in a collection
exports.decreaseItemQuantity = async (req, res) => {
  const { collectionId } = req.params;
  const { itemId } = req.body;
  try {
    let collection = await Collection.findById(collectionId);
    if (collection) {
      let existingItem = collection.items.find((item) => item.id.toString() === itemId);
      if (existingItem && existingItem.quantity > 0) {
        existingItem.quantity -= 1;
        if (existingItem.quantity === 0) {
          collection.items = collection.items.filter((item) => item.id.toString() !== itemId);
        }
      }
      await collection.save();
      res.status(200).json(collection);
    } else {
      res.status(404).send({ error: 'Collection not found.' });
    }
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// Create or Update a collection
exports.createOrUpdateCollection = async (req, res) => {
  const { itemData, userId } = req.body;
  try {
    let collection = await Collection.findOne({ userId });
    if (!collection) {
      collection = new Collection({
        userId,
        items: [itemData],
      });
    } else {
      let existingItem = collection.items.find((item) => item.id.toString() === itemData.id);
      if (existingItem) {
        Object.assign(existingItem, itemData);
      } else {
        collection.items.push(itemData);
      }
    }
    await collection.save();
    res.status(200).json(collection);
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find({});
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
};
