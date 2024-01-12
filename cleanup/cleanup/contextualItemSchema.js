// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const contextualItemSchema = new Schema(
//   {
//     cardVariant: { type: Schema.Types.ObjectId, ref: 'CardInContext.variants', required: true },
//     contextSpecificField: Schema.Types.Mixed,
//     notes: String,
//     addedAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//   },
//   { discriminatorKey: 'itemtype' },
// );

// const ContextualItem = mongoose.model('ContextualItem', contextualItemSchema);

// module.exports = { ContextualItem, contextualItemSchema };
