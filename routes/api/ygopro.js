const express = require('express');
const axios = require('axios');
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
