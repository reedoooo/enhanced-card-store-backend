const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    // Assuming you have other schemas like UserBasicData and UserSecurityData elsewhere
    userBasicData: {
      type: Schema.Types.ObjectId,
      ref: 'UserBasicData',
    },
    userSecurityData: {
      type: Schema.Types.ObjectId,
      ref: 'UserSecurityData',
    },
    searchHistory: [{ type: Schema.Types.ObjectId, ref: 'SearchHistory' }],
    allDecks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Deck',
      },
    ],
    allCollections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Collection',
      },
    ],
    // Ensure the user has a reference to a single cart
    cart: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
