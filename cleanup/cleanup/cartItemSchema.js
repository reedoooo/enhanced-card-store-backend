// // CartItem.js
// const mongoose = require('mongoose');
// const { contextualItemSchema, ContextualItem } = require('../contextualItemSchema');
// const Schema = mongoose.Schema;

// const cartItemSchema = new Schema({
//   cardId: { type: Schema.Types.ObjectId, ref: 'CardInContext' },
//   quantity: { type: Number, default: 1, min: 1 },
//   selectedVariant: { type: Schema.Types.ObjectId, ref: 'Variant' },
// });

// // const CartItem = contextualItemSchema.discriminator('CartItem', cartItemSchema);
// const CartItem = ContextualItem.discriminator('CartItem', cartItemSchema);

// module.exports = CartItem;
