const express = require('express');
const { cardController } = require('../../controllers/card');
const logger = require('../../configs/winston');
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
  logger.info('searchTerm', searchTerm);

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
    });
});
module.exports = router;
