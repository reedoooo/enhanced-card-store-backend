// // CollectionItem.js
// const mongoose = require('mongoose');
// const { contextualItemSchema, ContextualItem } = require('../contextualItemSchema');
// const Schema = mongoose.Schema;

// const collectionItemSchema = new Schema({
//   cardId: { type: Schema.Types.ObjectId, ref: 'CardInContext' },
//   condition: String,
//   quantity: { type: Number, default: 1 },
//   selectedVariant: { type: Schema.Types.ObjectId, ref: 'Variant' },
// });

// // const CollectionItem = contextualItemSchema.discriminator('CollectionItem', collectionItemSchema);
// const CollectionItem = ContextualItem.discriminator('CollectionItem', collectionItemSchema);

// module.exports = CollectionItem;
