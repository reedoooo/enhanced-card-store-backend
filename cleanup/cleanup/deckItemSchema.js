// // DeckItem.js
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const { contextualItemSchema, ContextualItem } = require('../contextualItemSchema');

// const deckItemSchema = new Schema({
//   cardId: { type: Schema.Types.ObjectId, ref: 'CardInContext' },
//   order: Number,
//   strategyNotes: String,
//   quantity: { type: Number, default: 1 },
//   selectedVariant: { type: Schema.Types.ObjectId, ref: 'Variant' },
// });

// // const DeckItem = contextualItemSchema.discriminator('DeckItem', deckItemSchema);
// const DeckItem = ContextualItem.discriminator('DeckItem', deckItemSchema);

// module.exports = DeckItem;
