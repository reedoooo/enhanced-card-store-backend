const mongoose = require('mongoose');
const logger = require('../configs/winston');
const { Schema, model } = mongoose;
require('colors');
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
UserSchema.pre('save', async function (next) {
  logger.info(`[Pre-save hook for user: `.red + `${this.username}`.white + `]`.red);
  // IF THIS IS THE FIRST TIME THE USER IS SAVED, LOG THE ENTIRE USER OBJECT
  if (this.isNew) {
    logger.info(`[NEW USER] `.green, this);
  }
  if (!this.isNew) {
    logger.info(`[UPDATED USER] `.blue, this);
  }
  this.lastUpdated = new Date();

  next();
});

// module.exports = model('User', UserSchema);
module.exports = {
  User: model('User', UserSchema),
  userSchema: UserSchema,
};
