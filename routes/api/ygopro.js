const express = require('express');
const axios = require('axios');
const getSingleCardInfo = require('../../utils/cardUtils');
const router = express.Router();

// Create axios instance with base URL
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

router.post('/', async (req, res) => {
  const { name, race, type, level, attribute } = req.body;

  try {
    const response = await instance.get(
      `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
    );

    // Add a quantity property to each card
    const cardsWithQuantity = response.data.data.map((card) => {
      return { ...card, quantity: 0 }; // Set initial quantity to 0
    });

    res.json({
      ...response.data,
      data: cardsWithQuantity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

router.patch('/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    //     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    //     const updatedCardInfo = data.data[0];

    const cardData = req.body;
    const userId = req.user._id; // Assuming you have user ID available in the request

    const result = await getSingleCardInfo(userId, cardId, cardData); // Pass cardData to the function
    res.status(200).json({ data: result, message: 'Card updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function queryBuilder(name, race, type, level, attribute) {
  let query = '';

  if (name) {
    query += `&fname=${encodeURIComponent(name)}`;
  }

  if (race) {
    query += `&race=${encodeURIComponent(race)}`;
  }

  if (type) {
    query += `&type=${encodeURIComponent(type)}`;
  }

  if (level) {
    query += `&level=${encodeURIComponent(level)}`;
  }

  if (attribute) {
    query += `&attribute=${encodeURIComponent(attribute)}`;
  }

  return query.startsWith('&') ? query.substring(1) : query;
}

module.exports = router;
