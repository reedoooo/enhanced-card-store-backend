const express = require('express');
const { asyncHandler } = require('../../utils/utils');
const { default: axios } = require('axios');
const { cardController } = require('../../controllers/Cards/CardController');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cards = await cardController.getAllCards();
    res.json(cards);
  }),
);

router.get(
  '/id/:id',
  asyncHandler(async (req, res) => {
    const card = await cardController.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Cannot find card' });
    }
    res.json(card);
  }),
);

router.get(
  '/name/:name',
  asyncHandler(async (req, res) => {
    const card = await cardController.getCardByName(req.params.name);
    if (!card) {
      return res.status(404).json({ message: 'Cannot find card' });
    }
    res.json(card);
  }),
);

router.get(
  '/type/:type',
  asyncHandler(async (req, res) => {
    const cards = await cardController.getCardByType(req.params.type);
    if (cards.length === 0) {
      return res.status(404).json({ message: 'Cannot find cards of given type' });
    }
    res.json(cards);
  }),
);

router.get(
  '/attribute/:attribute',
  asyncHandler(async (req, res) => {
    const cards = await cardController.getCardByAttribute(req.params.attribute);
    if (cards.length === 0) {
      return res.status(404).json({ message: 'Cannot find cards of given attribute' });
    }
    res.json(cards);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const updatedCard = await cardController.updateCardStock(req.params.id, req.body.inStock);
    res.json(updatedCard);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const newCard = await cardController.addCard(req.body);
    res.status(201).json(newCard);
  }),
);

// router.get('/ygopro/:imageUrl', async (req, res) => {
//   const { imageUrl } = req.params;
//   console.log('IMAGE URL FROM GET: -------------------------->', imageUrl);
//   try {
//     // response.data is an arraybuffer
//     const response = await axios({
//       method: 'GET',
//       url: imageUrl,
//       responseType: 'arraybuffer',
//     });

//     // Convert to base64 string and send to client
//     const buffer = Buffer.from(response.data, 'binary');
//     console.log('buffer', buffer);
//     // Set the response headers to match the image type and length so the client can render it
//     res.set({
//       'Content-Type': response.headers['content-type'],
//       'Content-Length': response.headers['content-length'],
//     });

//     // Send the image data to the client
//     res.send(buffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error fetching image');
//   }
// });
// Server-side route to fetch an image
router.get(
  '/image',
  asyncHandler(async (req, res) => {
    const { id, name } = req.query.imageURL; // Ensure you're using query parameters
    console.log('id', id);
    console.log('name', name);
    const bufferedImage = await cardController.fetchCardImage(id, name);
    console.log('bufferedImage', bufferedImage);
    res.status(200).json({ message: 'Success', data: bufferedImage });
  }),
);
// function convertRequestBodyToConcatenatedString(requestBody) {
//   // Extract the body from the request
//   const { body } = requestBody;

//   // Initialize an empty string to hold the concatenated result
//   let concatenatedString = '';

//   // Loop through the keys of the body object
//   for (const key in body) {
//     // Check if the current key is numeric, which indicates a character
//     if (!isNaN(key)) {
//       concatenatedString += body[key];
//     }
//   }

//   return concatenatedString;
// }
// router.get('/image', async (req, res) => {
//   const imageUrl = req.query.imageURL; // Ensure you're using query parameters

//   try {
//     const response = await axios.get(imageUrl, {
//       responseType: 'arraybuffer',
//     });

//     const buffer = Buffer.from(response.data, 'binary');
//     res.set({
//       'Content-Type': response.headers['content-type'],
//       'Content-Length': response.headers['content-length'],
//     });
//     res.send(buffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error fetching image', error);
//   }
// });
router.post(
  '/ygopro',
  asyncHandler(async (req, res) => {
    const { searchParams, user, searchTerm } = req.body;
    console.log('searchParams', searchParams);
    console.log('user', user);
    console.log('searchTerm', searchTerm);
    const transformedCards = await cardController.fetchAndTransformCardData({
      name: searchTerm,
      race: searchParams?.race,
      type: searchParams?.type,
      level: searchParams?.level,
      attribute: searchParams?.attribute,
      userId: user,
    });
    // console.log('transformedCards', transformedCards);
    res.json({ data: transformedCards });
  }),
);

router.patch(
  '/:cardId',
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const cardData = req.body;
    const updatedCardInfo = await cardController.patchCard(cardId, cardData);
    res.status(200).json({ message: 'Card updated successfully', data: updatedCardInfo });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleteSuccess = await cardController.deleteCard(req.params.id);
    if (!deleteSuccess) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.json({ message: 'Deleted card' });
  }),
);

module.exports = router;

// const express = require('express');
// const cardController = require('../../controllers/CardController');
// const getSingleCardInfo = require('../../utils/cardUtils');
// const { asyncHandler } = require('../../utils/utils');

// const router = express.Router();

// router.get('/', async (req, res, next) => {
//   try {
//     const cards = await cardController.getAllCards();
//     res.json(cards);
//   } catch (err) {
//     // res.status(500).json({ message: err.message });
//     next(err);
//   }
// });

// router.get('/id/:id', async (req, res, next) => {
//   try {
//     const card = await cardController.getCardById(req.params.id);
//     if (card === null) {
//       return res.status(404).json({ message: 'Cannot find card' });
//     }
//     res.json(card);
//   } catch (err) {
//     // return res.status(500).json({ message: err.message });
//     next(err);
//   }
// });

// router.get('/name/:name', async (req, res, next) => {
//   try {
//     const card = await cardController.getCardByName(req.params.name);
//     if (card === null) {
//       return res.status(404).json({ message: 'Cannot find card' });
//     }
//     res.json(card);
//   } catch (err) {
//     // return res.status(500).json({ message: err.message });
//     next(err);
//   }
// });

// router.get('/type/:type', async (req, res, next) => {
//   try {
//     const cards = await cardController.getCardByType(req.params.type);
//     if (cards.length === 0) {
//       return res.status(404).json({ message: 'Cannot find cards of given type' });
//     }
//     res.json(cards);
//   } catch (err) {
//     // return res.status(500).json({ message: err.message });
//     next(err);
//   }
// });

// router.get('/attribute/:attribute', async (req, res, next) => {
//   try {
//     const cards = await cardController.getCardByAttribute(req.params.attribute);
//     if (cards.length === 0) {
//       return res.status(404).json({ message: 'Cannot find cards of given attribute' });
//     }
//     res.json(cards);
//   } catch (err) {
//     // return res.status(500).json({ message: err.message });
//     next(err);
//   }
// });

// router.put('/:id', async (req, res, next) => {
//   try {
//     const updatedCard = await cardController.updateCardStock(req.params.id, req.body.inStock);
//     res.json(updatedCard);
//   } catch (err) {
//     // res.status(500).json({ message: err.message });
//     next(err);
//   }
// });

// router.post('/', async (req, res, next) => {
//   try {
//     const newCard = await cardController.addCard(req.body);
//     res.status(201).json(newCard);
//   } catch (err) {
//     // res.status(400).json({ message: err.message });
//     next(err);
//   }
// });

// router.post('/', async (req, res, next) => {
//   const { name, race, type, level, attribute } = req.body;

//   try {
//     const transformedCards = await cardController.fetchAndTransformCardData(
//       name,
//       race,
//       type,
//       level,
//       attribute,
//     );
//     res.json({ data: transformedCards });
//   } catch (error) {
//     console.error('Error in POST /:', error);
//     // res.status(500).send({ error: 'Internal Server Error' });
//     next(error);
//   }
// });

// router.patch('/:cardId', async (req, res, next) => {
//   const { cardId } = req.params;
//   const cardData = req.body; // The card data to be updated

//   try {
//     const updatedCardInfo = await cardController.patchCard(cardId, cardData);
//     res.status(200).json({ message: 'Card updated successfully', data: updatedCardInfo });
//   } catch (error) {
//     console.error(`Error updating card info for card ID ${cardId}:`, error);
//     // res.status(500).json({ message: error.message });
//     next(error);
//   }
// });

// // router.patch('/:cardId', async (req, res) => {
// //   try {
// //     const { cardId } = req.params;
// //     const cardData = req.body;
// //     const userId = req.user._id; // Assuming you have user ID available in the request

// //     const result = await getSingleCardInfo(userId, cardId, cardData); // Pass cardData to the function
// //     res.status(200).json({ data: result, message: 'Card updated successfully' });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // });

// router.delete('/:id', async (req, res) => {
//   try {
//     const deleteSuccess = await cardController.deleteCard(req.params.id);
//     if (!deleteSuccess) {
//       return res.status(404).json({ message: 'Card not found' });
//     }
//     res.json({ message: 'Deleted card' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;
