// Require Mongoose
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const createCommonSchema = (fields) => new Schema(fields, { _id: false });

const priceEntrySchema = createCommonSchema({ num: Number, timestamp: Date });
const cardImageSchema = createCommonSchema({
  id: { type: Number, required: false },
  image_url: String,
  image_url_small: String,
  image_url_cropped: String,
});
const cardPriceSchema = createCommonSchema({
  cardmarket_price: Types.Decimal128,
  tcgplayer_price: Types.Decimal128,
  ebay_price: Types.Decimal128,
  amazon_price: Types.Decimal128,
  coolstuffinc_price: Types.Decimal128,
});
const chartDatasetsSchema = createCommonSchema({ x: String, y: Number });
const collectionPriceHistorySchema = createCommonSchema({
  timestamp: Date,
  num: Number,
});
const cardSetSchema = new Schema(
  {
    set_name: String,
    set_code: String,
    set_rarity: String,
    set_rarity_code: String,
    set_price: Types.Decimal128,
    // model of the card which this set belongs to
    cardModel: {
      type: String,
      enum: ['CardInSearch', 'CardInCollection', 'CardInDeck', 'CardInCart'],
    },
    cardId: { type: Schema.Types.ObjectId, refPath: 'cardModel' },
  },
  { timestamps: true },
);
const cardVariantSchema = new Schema(
  {
    set_name: String,
    set_code: String,
    rarity: String,
    rarity_code: String,
    price: Types.Decimal128,
    selected: { type: Boolean, default: false },
    alt_art_image_url: String,
    set: { type: Schema.Types.ObjectId, ref: 'CardSet' }, // Reference to the CardSet
    cardModel: {
      type: String,
      enum: ['CardInSearch', 'CardInCollection', 'CardInDeck', 'CardInCart'],
    },
    cardId: { type: Schema.Types.ObjectId, refPath: 'cardModel' },
  },
  { timestamps: true },
);
const searchTermSchema = new Schema({
  name: { type: String },
  race: { type: String },
  attribute: { type: String },
  type: { type: String },
  level: { type: Number },
  id: { type: String },
});
const searchResultSchema = new Schema({
  cardId: { type: Schema.Types.ObjectId, ref: 'CardInSearch' },
  // Additional fields as needed
});
const searchSessionSchema = new Schema(
  {
    label: { type: String, required: true },
    searchTerms: [searchTermSchema],
    results: [searchResultSchema],
  },
  { timestamps: true },
);

module.exports = {
  // cards
  priceEntrySchema,
  cardSetSchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  // collections
  collectionPriceHistorySchema,
  // variants
  cardVariantSchema,
  // search
  searchTermSchema,
  searchResultSchema,
  searchSessionSchema,
};
