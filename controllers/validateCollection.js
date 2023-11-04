const mongoose = require('mongoose');
const CardBase = require('../models/CardBase');
const { Schema } = mongoose;

// Assuming `CardBaseSchema` is already validated elsewhere and imported here

module.exports.validateCardInCollection = function validateCardInCollection(card) {
  if (!card) {
    console.error('CardInCollection is null or undefined');
    return false;
  }

  // Validate using CardBaseSchema's validator if exists
  if (CardBase.validateCardBase && !CardBase.validateCardBase(card)) {
    console.error('CardBase validation failed');
    return false;
  }

  // Validate the 'id' field
  if (typeof card.id !== 'string' || card.id.trim() === '') {
    console.error('card.id is invalid', card.id);
    return false;
  }

  // Validate the 'price' and 'totalPrice' fields
  if (typeof card.price !== 'number' || card.price <= 0) {
    console.error('card.price is invalid', card.price);
    return false;
  }

  if (typeof card.totalPrice !== 'number' || card.totalPrice <= 0) {
    console.error('card.totalPrice is invalid', card.totalPrice);
    return false;
  }

  // Validate the 'quantity' field
  if (typeof card.quantity !== 'number' || card.quantity <= 0) {
    console.error('card.quantity is invalid', card.quantity);
    return false;
  }

  // Validate 'chart_datasets'
  if (
    !Array.isArray(card.chart_datasets) ||
    card.chart_datasets.some(
      (ds) => typeof ds.x !== 'object' || !(ds.x instanceof Date) || typeof ds.y !== 'number',
    )
  ) {
    console.error('card.chart_datasets is invalid', card.chart_datasets);
    return false;
  }

  return true; // If all validations pass
};

// You would then use `validateCardInCollection` in your schema definition or as a pre-save middleware
