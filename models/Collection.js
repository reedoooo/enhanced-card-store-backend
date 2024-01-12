const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
} = require('./CommonSchemas');
// const { updateCardDetails } = require('./globalHelpers');
require('colors');
const Deck = model(
  'Deck',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
      name: String,
      description: String,
      totalPrice: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 },
      tags: [String],
      color: String,
      cards: [{ type: Schema.Types.ObjectId, ref: 'CardInDeck' }],
    },
    { timestamps: true },
  ),
);
const Cart = model(
  'Cart',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
      totalPrice: { type: Number, default: 0 },
      totalQuantity: { type: Number, default: 0 },
      cart: [{ type: Schema.Types.ObjectId, ref: 'CardInCart' }],
    },
    { timestamps: true },
  ),
);
const Collection = model(
  'Collection',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
      name: String,
      description: String,
      totalPrice: Number,
      quantity: Number,
      totalQuantity: Number,
      previousDayTotalPrice: Number,
      dailyPriceChange: String,
      priceDifference: Number,
      priceChange: Number,
      latestPrice: priceEntrySchema,
      lastSavedPrice: priceEntrySchema,
      dailyCollectionPriceHistory: [collectionPriceHistorySchema],
      collectionPriceHistory: [collectionPriceHistorySchema],
      chartData: {
        name: String,
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
        allXYValues: [{ label: String, x: Date, y: Number }],
      },
      cards: [{ type: Schema.Types.ObjectId, ref: 'CardInCollection' }],
    },
    { timestamps: true },
  ),
);
const SearchHistory = model(
  'SearchHistory',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      sessions: [searchSessionSchema],
      // Create new cards field which references all unique cards in all sessions
      cards: [{ type: Schema.Types.ObjectId, ref: 'CardInSearch' }],
    },
    { timestamps: true },
  ),
);
module.exports = {
  Deck,
  Cart,
  Collection,
  SearchHistory,
};
