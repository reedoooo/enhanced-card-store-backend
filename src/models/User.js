const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    userId: { type: String, required: false, unique: true },
    email: { type: String, required: false, unique: true },
    loginStatus: { type: Boolean, required: false, default: false },
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    lastUpdated: { type: Date, required: false },
    generalUserStats: {
      type: Schema.Types.ObjectId,
      ref: 'GeneralUserStats',
    },
    userBasicData: {
      type: Schema.Types.ObjectId,
      ref: 'UserBasicData',
    },
    userSecurityData: {
      type: Schema.Types.ObjectId,
      ref: 'UserSecurityData',
    },
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
    cart: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
