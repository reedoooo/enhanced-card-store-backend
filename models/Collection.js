const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
} = require('./CommonSchemas');
const { CardInCollection, CardInDeck, CardInCart } = require('./Card');
require('colors');
const DeckSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
    name: String,
    description: String,
    totalPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    tags: [String],
    color: String,
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInDeck' }],
  },
  { timestamps: true },
);
DeckSchema.pre('save', async function (next) {
  this.totalPrice = 0;
  this.quantity = 0;

  if (this.cards && this.cards.length > 0) {
    const deckCards = await CardInDeck.find({ _id: { $in: this.cards } });

    for (const card of deckCards) {
      this.totalPrice += card.price * card.quantity;
      this.quantity += card.quantity;
    }
  }

  next();
});

const CartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
    totalPrice: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    cart: [{ type: Schema.Types.ObjectId, ref: 'CardInCart' }],
  },
  { timestamps: true },
);
CartSchema.pre('save', async function (next) {
  this.totalPrice = 0;
  this.totalQuantity = 0;

  if (this.cart && this.cart.length > 0) {
    const cartItems = await CardInCart.find({ _id: { $in: this.cart } });

    for (const item of cartItems) {
      this.totalPrice += item.price * item.quantity;
      this.totalQuantity += item.quantity;
    }
  }

  next();
});

const CollectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
    // user customizable fields
    name: String,
    description: String,
    // aggregate of each card totalPrice
    totalPrice: Number,
    // num different cards
    quantity: Number,
    // num total cards
    totalQuantity: Number,
    // price change ($) within the last 24 hours at any given time
    dailyPriceChange: Number,
    // price change (%) within the last 24 hours at any given time
    dailyPercentageChange: String,
    collectionStatistics: {
      highPoint: Number,
      lowPoint: Number,
      twentyFourHourAverage: {
        startDate: Date,
        endDate: Date,
        lowPoint: Number,
        highPoint: Number,
        priceChange: Number,
        percentageChange: Number,
        priceIncreased: Boolean,
      },
      average: Number,
      volume: Number,
      volatility: Number,
      general: {
        totalPrice: Number,
        topCard: String,
        topCollection: String,
      },
    },
    // most recent price of the collection
    latestPrice: priceEntrySchema,
    // previous price of the collection
    lastSavedPrice: priceEntrySchema,
    // TODO: price history of the collection (set every 24 hours by cron job)
    dailyCollectionPriceHistory: [collectionPriceHistorySchema],
    // price history of collection every time a card is added or removed
    collectionPriceHistory: [collectionPriceHistorySchema],
    chartData: {
      name: String,
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
      // the x y values for the colectionPriceHistory
      allXYValues: [{ label: String, x: Date, y: Number }],
    },
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInCollection' }],
  },
  { timestamps: true },
);
CollectionSchema.pre('save', async function (next) {
  // Reset statistics
  this.totalPrice = 0;
  this.totalQuantity = 0;
  this.collectionStatistics.highPoint = 0;
  this.collectionStatistics.lowPoint = Infinity;

  if (this.cards && this.cards.length > 0) {
    const cardsData = await CardInCollection.find({
      _id: { $in: this.cards },
    });

    // Iterate over cards to calculate statistics
    for (const card of cardsData) {
      this.totalPrice += card.price * card.quantity;
      this.totalQuantity += card.quantity;

      this.collectionStatistics.highPoint = Math.max(
        this.collectionStatistics.highPoint,
        card.price,
      );
      this.collectionStatistics.lowPoint = Math.min(this.collectionStatistics.lowPoint, card.price);
    }

    this.collectionStatistics.average = this.totalPrice / this.totalQuantity;
  }

  if (this.cards.length === 0) {
    this.collectionStatistics.lowPoint = 0;
  }

  const now = new Date();

  // Check if it's an update (not a new creation)
  if (!this.isNew) {
    // Append to dailyCollectionPriceHistory
    this.dailyCollectionPriceHistory.push({
      timestamp: now,
      price: this.totalPrice,
    });

    // Determine if there should be a new entry in collectionPriceHistory
    // This can be based on time since last update or significant price change
    const lastEntry = this.collectionPriceHistory[this.collectionPriceHistory.length - 1];
    if (!lastEntry || significantPriceChange(lastEntry.price, this.totalPrice)) {
      this.collectionPriceHistory.push({
        timestamp: now,
        price: this.totalPrice,
      });
    }
  }

  next();
});

function significantPriceChange(lastPrice, newPrice) {
  // Define the criteria for a significant price change
  // Example: price change more than 10%
  return Math.abs(newPrice - lastPrice) / lastPrice > 0.1;
}

const Deck = model('Deck', DeckSchema);
const Cart = model('Cart', CartSchema);
const Collection = model('Collection', CollectionSchema);
const SearchHistory = model(
  'SearchHistory',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      sessions: [searchSessionSchema],
      // Create new cards field which references all unique cards in all sessions
      cards: [{ type: Schema.Types.ObjectId, ref: 'CardInSearch' }],
    },
    { timestamps: true },
  ),
);
module.exports = {
  Deck,
  Cart,
  Collection,
  SearchHistory,
};
