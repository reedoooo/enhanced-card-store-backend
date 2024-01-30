const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
} = require('./CommonSchemas');
const { CardInCollection, CardInDeck, CardInCart } = require('./Card');
const { format } = require('date-fns');
require('colors');
const createNewPriceEntry = (price) => {
  return {
    num: price,
    timestamp: new Date(),
  };
};
function createNivoXYValue(date, value, idPrefix) {
  const formattedTime = format(date, 'h:mma'); // Formats time to 12-hour format with AM/PM
  return {
    x: formattedTime,
    y: value,
    // id: `${idPrefix}${formattedTime}`,
  };
}
const DeckSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, unique: false },
    name: String,
    description: String,
    totalPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    tags: [String],
    color: String,
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInDeck' }],
  },
  { timestamps: true },
);
DeckSchema.pre('save', async function (next) {
  console.log('pre save hook for collection', this.name.blue);

  // Reset statistics
  this.totalPrice = 0;
  this.quantity = 0;
  // this.collectionStatistics.highPoint = 0;
  // this.collectionStatistics.lowPoint = Infinity;

  if (this.cards && this.cards.length > 0) {
    const deckCards = await CardInDeck.find({ _id: { $in: this.cards } });

    // Calculate totalQuantity by iterating over cards
    this.totalQuantity = deckCards.reduce((total, card) => {
      this.totalPrice += card.price * card.quantity;
      // this.collectionStatistics.highPoint = Math.max(
      //   this.collectionStatistics.highPoint,
      //   card.price,
      // );
      // this.collectionStatistics.lowPoint = Math.min(this.collectionStatistics.lowPoint, card.price);
      return total + card.quantity;
    }, 0);
    console.log('totalQuantity', this.totalQuantity);

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
    nivoChartData: [
      {
        id: String,
        color: String,
        data: [{ x: Date, y: Number }],
      },
    ],
    muiChartData: [
      {
        id: String,
        value: Number,
        label: String,
        color: String,
      },
    ],
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInCollection' }],
  },
  { timestamps: true },
);
CollectionSchema.pre('save', async function (next) {
  try {
    console.log('pre save hook for collection', this.name);

    // Reset statistics
    this.totalPrice = 0;
    this.totalQuantity = 0;
    this.collectionStatistics.highPoint = 0;
    this.collectionStatistics.lowPoint = Infinity;
    this.nivoChartData = [{ id: this.name, color: '#2e7c67', data: [] }];
    this.muiChartData = [];

    if (this.cards && this.cards.length > 0) {
      const cardsInCollection = await CardInCollection.find({
        _id: { $in: this.cards },
      });

      let lastXValue = new Date();
      let runningTotalPrice = 0;

      for (const card of cardsInCollection) {
        const cardTotalPrice = card.price * card.quantity;

        this.totalPrice += cardTotalPrice;
        this.totalQuantity += card.quantity;

        for (let i = 0; i < card.quantity; i++) {
          runningTotalPrice += card.price;
          // NIVO BASIC DATA
          this.nivoChartData[0].data.push({
            // id: `${card.name}-${this.totalPrice}`,
            x: new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000), // 6 hours ahead of lastXValue
            y: runningTotalPrice,
          });
          lastXValue = new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000); // Update lastXValue
        }

        this.collectionStatistics.highPoint = Math.max(
          this.collectionStatistics.highPoint,
          card.price,
        );
        this.collectionStatistics.lowPoint = Math.min(
          this.collectionStatistics.lowPoint,
          card.price,
        );
      }

      this.latestPrice = createNewPriceEntry(this.totalPrice);
      this.lastSavedPrice = createNewPriceEntry(this.totalPrice);
      this.collectionPriceHistory.push(createNewPriceEntry(this.totalPrice));
      this.collectionStatistics.average =
        this.totalQuantity > 0 ? this.totalPrice / this.totalQuantity : 0;
      this.chartData.allXYValues.push({
        label: this.name,
        x: new Date(),
        y: this.totalPrice,
      });
      // Fetch all collections
      const allCollections = await this.model('Collection').find().populate('cards');

      // Define the colors array
      const colors = [
        'darkest',
        'darker',
        'dark',
        'default',
        'light',
        'lighter',
        'lightest',
        'contrastText',
      ];
      // Create muiChartData
      // Create muiChartData
      this.muiChartData = allCollections.map((collection, index) => {
        const label = `${collection.name} - ${collection.totalPrice} - ${index}`;
        const value = collection.totalPrice;
        const colorIndex = index % colors.length; // Cycle through the colors array
        const color = colors[colorIndex];
        const id = collection._id; // Assuming _id is a unique identifier

        return { id, label, value, color };
      });

      // this.nivoChartData?.data?.push(
      //   createNivoXYValue(new Date(), this.totalPrice, `${this.name}-nivo-chart-`),
      // );
    }

    const now = new Date();
    if (!this.isNew) {
      this.dailyCollectionPriceHistory.push({ timestamp: now, price: this.totalPrice });

      const lastEntry = this.collectionPriceHistory[this.collectionPriceHistory.length - 1];
      if (!lastEntry || significantPriceChange(lastEntry.price, this.totalPrice)) {
        this.collectionPriceHistory.push({ timestamp: now, price: this.totalPrice });
      }
    }

    next();
  } catch (error) {
    console.error('Error in CollectionSchema pre-save hook:', error);
    next(error);
  }
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
