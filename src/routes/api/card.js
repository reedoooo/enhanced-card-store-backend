const express = require('express');
const { cardController } = require('../../controllers/Cards/CardController');

const router = express.Router();

router.get('/', async (req, res, next) => {
  cardController
    .getAllCards()
    .then((cards) => {
      res.json(cards);
    })
    .catch(next);
});

router.get('/randomCardData', async (req, res, next) => {
  cardController
    .fetchDataForRandomCards()
    .then((cards) => {
      res.json(cards);
    })
    .catch(next);
});

router.post('/ygopro', async (req, res, next) => {
  const { searchParams, user, searchTerm } = req.body;
  console.log('searchParams', searchParams);
  console.log('user', user);
  console.log('searchTerm', searchTerm);

  cardController
    .fetchAndTransformCardData({
      name: searchTerm,
      race: searchParams?.race,
      type: searchParams?.type,
      level: searchParams?.level,
      attribute: searchParams?.attribute,
      userId: user,
    })
    .then((transformedCards) => {
      res.json({ data: transformedCards });
    })
    .catch(next);
});

router.patch('/:cardId', async (req, res, next) => {
  const { cardId } = req.params;
  const cardData = req.body;

  cardController
    .patchCard(cardId, cardData)
    .then((updatedCardInfo) => {
      res
        .status(200)
        .json({ message: 'Card updated successfully', data: updatedCardInfo });
    })
    .catch(next);
});

module.exports = router;
