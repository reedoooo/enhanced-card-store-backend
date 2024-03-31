const express = require("express");
const { asyncHandler } = require("../../utils/utils");
const { default: axios } = require("axios");
const { cardController } = require("../../controllers/Cards/CardController");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cards = await cardController.getAllCards();
    res.json(cards);
  })
);
router.get(
  "/randomCardData",
  asyncHandler(async (req, res) => {
    const cards = await cardController.fetchDataForRandomCards();
    res.json(cards);
  })
);
router.post(
  "/ygopro",
  asyncHandler(async (req, res) => {
    const { searchParams, user, searchTerm } = req.body;
    console.log("searchParams", searchParams);
    console.log("user", user);
    console.log("searchTerm", searchTerm);
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
  })
);
router.patch(
  "/:cardId",
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const cardData = req.body;
    const updatedCardInfo = await cardController.patchCard(cardId, cardData);
    res
      .status(200)
      .json({ message: "Card updated successfully", data: updatedCardInfo });
  })
);

module.exports = router;
