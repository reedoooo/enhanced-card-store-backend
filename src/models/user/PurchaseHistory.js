// PurchaseHistoryModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const purchaseHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    transactions: [
      {
        cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
        price: { type: Number, required: true },
        purchaseDate: { type: Date, default: Date.now },
        // Additional details like condition of the card, seller info, etc.
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('PurchaseHistory', purchaseHistorySchema);
