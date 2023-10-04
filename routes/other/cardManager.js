const express = require('express');
const { postLimiter, asyncHandler } = require('../../utils/utils');
const { setUserId, getCardInfo, updateCardPrice } = require('./itemUpdates');

const updateCardsInItem = async (item, userId, collectionId, chartId) => {
  const itemType = item.constructor.modelName;
  let totalPrice = 0;

  setUserId(userId);

  const cards = Array.isArray(item.cards) ? item.cards : item.cart?.cards || [];

  for (const card of cards) {
    const cardId = card.id;

    if (!cardId) {
      console.warn(`Card ID missing for ${itemType}: ${card.name}`);
      continue;
    }

    const cardInfo = await getCardInfo(cardId);
    if (!cardInfo) {
      console.warn(`Card info not found for ${itemType} (ID: ${cardId}): ${card.name}`);
      continue;
    }

    const cardPriceUpdate = await updateCardPrice(card, cardInfo, userId, collectionId, chartId);

    // Check if cardPriceUpdate is defined and has property totalCardPrice
    if (cardPriceUpdate && 'totalCardPrice' in cardPriceUpdate) {
      const { totalCardPrice } = cardPriceUpdate;

      if (!isNaN(totalCardPrice) && totalCardPrice >= 0) {
        console.log('Price update successful for', card.name + ':', totalCardPrice);
        totalPrice += totalCardPrice;
      }
    } else {
      console.warn(`Price update failed for ${itemType} (ID: ${cardId}): ${card.name}`);
    }
  }

  return totalPrice;
};

module.exports = {
  updateCardsInItem,
};
