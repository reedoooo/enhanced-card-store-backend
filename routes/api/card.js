const express = require('express');
const cardController = require('../../controllers/CardController');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cards = await cardController.getAllCards();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/id/:id', async (req, res) => {
  try {
    const card = await cardController.getCardById(req.params.id);
    if (card === null) {
      return res.status(404).json({ message: 'Cannot find card' });
    }
    res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/name/:name', async (req, res) => {
  try {
    const card = await cardController.getCardByName(req.params.name);
    if (card === null) {
      return res.status(404).json({ message: 'Cannot find card' });
    }
    res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/type/:type', async (req, res) => {
  try {
    const cards = await cardController.getCardByType(req.params.type);
    if (cards.length === 0) {
      return res
        .status(404)
        .json({ message: 'Cannot find cards of given type' });
    }
    res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/attribute/:attribute', async (req, res) => {
  try {
    const cards = await cardController.getCardByAttribute(req.params.attribute);
    if (cards.length === 0) {
      return res
        .status(404)
        .json({ message: 'Cannot find cards of given attribute' });
    }
    res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedCard = await cardController.updateCardStock(
      req.params.id,
      req.body.inStock,
    );
    res.json(updatedCard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newCard = await cardController.addCard(req.body);
    res.status(201).json(newCard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleteSuccess = await cardController.deleteCard(req.params.id);
    if (!deleteSuccess) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.json({ message: 'Deleted card' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
