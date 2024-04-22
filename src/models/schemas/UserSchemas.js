const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const generalUserStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // User Stats
  totalDecks: { type: Number, default: 0 },
  totalCollections: { type: Number, default: 0 },
  totalCardsInCollections: { type: Number, default: 0 },

  // System Information
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})
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
const userBasicDataSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  firstName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },
  // Contact Information
  email: { type: String },
  phone: { type: String },
  address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
  },
  timezone: { type: String },
  titles: [String],
  image: { type: String },
  coverImage: { type: String },
  bio: { type: String },
  interests: [String],
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
  },
  preferences: {
    language: { type: String, default: 'English' },
    privacy: {
      showEmail: { type: Boolean, default: true },
      showProfile: { type: Boolean, default: true },
    },
  },
  wishlist: [wishlistSchema],
  purchaseHistory: [purchaseHistorySchema],
  preferredPaymentMethod: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const roleSchema = new Schema({
  name: { type: String, required: false, default: 'admin' },
  capabilities: { type: Array, required: false, default: ['read', 'write', 'update', 'delete'] },
});
const userSecurityDataSchema = new Schema({
  // USER AUTHENTICATION
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  accessToken: { type: String, required: false },
  refreshToken: { type: String, required: false },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // sparse: true allows for null values but enforces uniqueness where the field is not null
  role_data: roleSchema,
  lastLogin: { type: Date },
  accountCreated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  securityQuestions: [
    {
      question: { type: String },
      answer: { type: String },
    },
  ],
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
});
// Pre-save hook to hash password before saving (if using bcryptjs)
// data.pre('save', function (next) {
//   if (this.isModified('password')) {
//     this.password = bcrypt.hashSync(this.password, 8);
//   }
//   next();
// });

module.exports = {
  UserSecurityData: model('UserSecurityData', userSecurityDataSchema),
	UserBasicData: model('UserBasicData', userBasicDataSchema),
};
