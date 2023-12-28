const mongoose = require('mongoose');
const { Schema } = mongoose;
// const bcrypt = require('bcrypt'); // If you plan to hash passwords

const roleSchema = new Schema({
  name: { type: String, required: true, default: 'user' },
  capabilities: { type: Array, required: false, default: ['read'] },
});

const userSecurityDataSchema = new Schema({
  // _id: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  // Basic Account Information
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // sparse: true allows for null values but enforces uniqueness where the field is not null
  token: { type: String, required: false },
  // Role Data
  role_data: roleSchema,

  // Account Status and Management
  lastLogin: { type: Date },
  accountCreated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },

  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Security Questions (Optional)
  securityQuestions: [
    {
      question: { type: String },
      answer: { type: String },
    },
  ],

  // Two-Factor Authentication
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
}); // Auto manage createdAt and updatedAt

// Pre-save hook to hash password before saving (if using bcryptjs)
// data.pre('save', function (next) {
//   if (this.isModified('password')) {
//     this.password = bcrypt.hashSync(this.password, 8);
//   }
//   next();
// });

module.exports = mongoose.model('UserSecurityData', userSecurityDataSchema);
