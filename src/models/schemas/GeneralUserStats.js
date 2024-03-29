const mongoose = require('mongoose');
const { Schema } = mongoose;

const generalUserStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // User Stats
  totalDecks: { type: Number, default: 0 },
  totalCollections: { type: Number, default: 0 },
  totalCardsInCollections: { type: Number, default: 0 },

  // System Information
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GeneralUserStats', generalUserStatsSchema);
