// const express = require("express");
// const axios = require("axios");
// const router = express.Router();
// const { Cards } = require('../models');

// // ... rest of your code ...

// // Create axios instance with base URL
// const instance = axios.create({
//   baseURL: "https://db.ygoprodeck.com/api/v7/",
// });

// router.post("/", async (req, res) => {
//   const { name, race, type, level, attribute } = req.body;
//   try {
//     const response = await instance.get(
//       `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`
//     );
//     // const createdCards = [];

//     await Promise.all(
//       response.data.data.map(async (cardData) => {
//         try {
//             const createdCard = await Cards.create({
//                 id: cardData.id,
//                 name: cardData.name,
//                 type: cardData.type || null,
//                 frameType: cardData.frameType || null,
//                 description: cardData["desc"] || null, // Fixed the issue here
//                 card_images: cardData.card_images || null,
//                 archetype: cardData.archetype || null,
//                 atk: cardData.atk || null,
//                 def: cardData.def || null,
//                 level: cardData.level || null,
//                 attribute: cardData.attribute || null,
//                 race: cardData.race || null,
//               });
//             //   createdCards.push(createdCard);
//               console.log("Card created:", createdCard);
//         } catch (createErr) {
//           console.error("Failed to create Card:", createErr);
//         }
//         res.json({
//             success: true,
//             message: "Cards created successfully.",
//             createdCard,
//           });
//       })
//     );

//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

// function queryBuilder(name, race, type, level, attribute) {
//   let query = "";

//   if (name) {
//     query += `&fname=${encodeURIComponent(name)}`;
//   }

//   if (race) {
//     query += `&race=${encodeURIComponent(race)}`;
//   }

//   if (type) {
//     query += `&type=${encodeURIComponent(type)}`;
//   }

//   if (level) {
//     query += `&level=${encodeURIComponent(level)}`;
//   }

//   if (attribute) {
//     query += `&attribute=${encodeURIComponent(attribute)}`;
//   }

//   return query.startsWith("&") ? query.substring(1) : query;
// }

// module.exports = router;

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Create axios instance with base URL
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

router.post('/', async (req, res) => {
  //   const { name, race, type, level, attribute, userID } = req.body;
  const { name, race, type, level, attribute } = req.body;

  console.log('name', name);
  console.log('race', race);
  console.log('type', type);
  console.log('level', level);
  console.log('attribute', attribute);
  try {
    const response = await instance.get(
      `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
    );
    res.json(response.data);
    // console.log('response', response.data);
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
