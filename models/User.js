const mongoose = require('mongoose');
const Deck = require('./Deck');
const { CronDataSchema } = require('./CronData');
const { collectionSchema, ChartDataSchema } = require('./Collection');

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
    // cards: [{ type: Schema.Types.ObjectId, ref: 'CardBase' }],
    allDecks: [{ type: Schema.Types.ObjectId, ref: 'Deck' }],
    allCollections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    allChartDatas: [{ type: Schema.Types.ObjectId, ref: 'ChartData' }],
    allCronDatas: [{ type: Schema.Types.ObjectId, ref: 'CronData' }],
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' }, // Added this line

    // allCronData: [CronDataSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
