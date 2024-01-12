// WishlistModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cards: [
      {
        cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
