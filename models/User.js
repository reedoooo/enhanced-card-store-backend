const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    userBasicData: {
      type: Schema.Types.ObjectId,
      ref: 'UserBasicData',
    },
    userSecurityData: {
      type: Schema.Types.ObjectId,
      ref: 'UserSecurityData',
    },
    allDecks: [{ type: Schema.Types.ObjectId, ref: 'Deck' }],
    allCollections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' }, // Added this line
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
