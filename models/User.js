const mongoose = require('mongoose');
const { Schema } = mongoose;

const baseInfo = new Schema({
  name: { type: String, required: true },
  titles: [String],
  image: String,
  description_header: String,
  description: String,
});

const roleSchema = new Schema({
  name: { type: String, required: true },
  capabilities: [Array],
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
    basic_info: baseInfo,
    login_data: {
      type: securityInfo,
      required: true,
    },
    allDecks: [{ type: Schema.Types.ObjectId, ref: 'Deck' }],
    allCollections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' }, // Added this line
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
