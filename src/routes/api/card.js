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
router.get(
  "/id/:id",
  asyncHandler(async (req, res) => {
    const card = await cardController.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Cannot find card" });
    }
    res.json(card);
  })
);

router.get(
  "/name/:name",
  asyncHandler(async (req, res) => {
    const card = await cardController.getCardByName(req.params.name);
    if (!card) {
      return res.status(404).json({ message: "Cannot find card" });
    }
    res.json(card);
  })
);

router.get(
  "/type/:type",
  asyncHandler(async (req, res) => {
    const cards = await cardController.getCardByType(req.params.type);
    if (cards.length === 0) {
      return res
        .status(404)
        .json({ message: "Cannot find cards of given type" });
    }
    res.json(cards);
  })
);

router.get(
  "/attribute/:attribute",
  asyncHandler(async (req, res) => {
    const cards = await cardController.getCardByAttribute(req.params.attribute);
    if (cards.length === 0) {
      return res
        .status(404)
        .json({ message: "Cannot find cards of given attribute" });
    }
    res.json(cards);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const updatedCard = await cardController.updateCardStock(
      req.params.id,
      req.body.inStock
    );
    res.json(updatedCard);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const newCard = await cardController.addCard(req.body);
    res.status(201).json(newCard);
  })
);
router.get(
  "/image",
  asyncHandler(async (req, res) => {
    const { id, name } = req.query.imageURL; // Ensure you're using query parameters
    console.log("id", id);
    console.log("name", name);
    const bufferedImage = await cardController.fetchCardImage(id, name);
    console.log("bufferedImage", bufferedImage);
    res.status(200).json({ message: "Success", data: bufferedImage });
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

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleteSuccess = await cardController.deleteCard(req.params.id);
    if (!deleteSuccess) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json({ message: "Deleted card" });
  })
);

module.exports = router;
