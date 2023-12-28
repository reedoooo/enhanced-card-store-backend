const mongoose = require('mongoose');
const { Schema } = mongoose;

const userBasicDataSchema = new Schema({
  // System Information
  // _id: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  // Personal Information
  firstName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },

  // Contact Information
  email: { type: String },
  phone: { type: String },

  // Location Information
  address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
  },
  timezone: { type: String },

  // Profile Information
  titles: [String],
  image: { type: String },
  coverImage: { type: String },
  bio: { type: String },
  interests: [String],

  // Social Links
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    // etc...
  },

  // Account Settings
  preferences: {
    language: { type: String, default: 'English' },
    privacy: {
      showEmail: { type: Boolean, default: true },
      showProfile: { type: Boolean, default: true },
      // etc...
    },
  },

  // E-commerce Related
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'WishList' }],
  purchaseHistory: [{ type: Schema.Types.ObjectId, ref: 'PurchaseHistory' }],
  preferredPaymentMethod: { type: String },

  // System Information
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserBasicData', userBasicDataSchema);
