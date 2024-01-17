const mongoose = require('mongoose');
const { Schema } = mongoose;
// const bcrypt = require('bcrypt'); // If you plan to hash passwords

// const roleSchema = new Schema({
//   name: { type: String, required: true, default: 'user' },
//   capabilities: { type: Array, required: false, default: ['read'] },
// });
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
