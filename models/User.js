const mongoose = require('mongoose');
const { Schema } = mongoose;
// const cartInfo = require('./Cart.js');

const baseInfo = new Schema({
  name: { type: String, required: true },
  titles: [String],
  image: String,
  description_header: String,
  description: String,
});

const roleSchema = new Schema({
  name: { type: String, required: true },
  capabilities: [String],
});

const securityInfo = new Schema({
  name: { type: String },
  username: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  email: { type: String },
  role_data: { type: roleSchema, required: true },
});

const UserSchema = new Schema(
  {
    basic_info: { type: baseInfo, required: false },
    // activity_data: { type: cartInfo, required: false },
    login_data: { type: securityInfo, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
