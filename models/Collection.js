const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
  dataPointSchema,
} = require('./CommonSchemas');
const { CardInCollection, CardInDeck, CardInCart } = require('./Card');
const { format } = require('date-fns');
// const { formatDate } = require('../utils/utils');
require('colors');
const groupAndAverageDataForRanges = (data, timeRanges) => {
  const processedData = {};
  const clusterCounts = {
    '24h': 24,
    '7d': 7,
    '30d': 30,
    '90d': 30,
    '180d': 30,
    '270d': 30,
    '365d': 30,
  };

  Object.keys(clusterCounts).forEach((rangeKey) => {
    const numClusters = clusterCounts[rangeKey];
    const timeRangeData = timeRanges[rangeKey];
    let averagedData = [];
    if (timeRangeData && timeRangeData.length >= numClusters) {
      // More data points than clusters, perform averaging within clusters
      console.log('More data points than clusters, performing averaging...'.red);
      averagedData = timeRangeData
        .sort((a, b) => new Date(a.x) - new Date(b.x)) // Ensure data is sorted by time
        .reduce((clusters, point, index, array) => {
          // console.log('Point:', point);
          const clusterIndex = Math.floor(index / (array.length / numClusters));
          // console.log('Cluster index:', clusterIndex);
          clusters[clusterIndex] = clusters[clusterIndex] || [];
          clusters[clusterIndex].push(point);
          return clusters;
        }, new Array(numClusters).fill(null))
        .map((cluster) => {
          const avgNum = cluster.reduce((sum, p) => sum + p.num, 0) / cluster.length;
          const midPoint = cluster[Math.floor(cluster.length / 2)];
          const formatDate = (date) => format(date, 'yyyy-MM-dd HH:mm:ss');
          return {
            label: formatDate(new Date(midPoint.timestamp)),
            x: new Date(midPoint.timestamp).toISOString(),
            y: avgNum,
          };
        });
    } else if (timeRangeData && timeRangeData?.length > 0) {
      // Fewer data points than clusters, interpolate additional points
      console.log('Fewer data points than clusters, interpolating additional points...'.red);
      for (let i = 0; i < numClusters; i++) {
        if (i < timeRangeData.length) {
          averagedData.push(timeRangeData[i]);
        } else {
          const lastPoint = averagedData[averagedData.length - 1];
          const nextIndex = i + 1 - averagedData.length;
          const nextPoint =
            timeRangeData[nextIndex < timeRangeData.length ? nextIndex : timeRangeData.length - 1];
          const interpolatedY =
            lastPoint && nextPoint ? (lastPoint.y + nextPoint.y) / 2 : lastPoint.y;
          averagedData.push({ x: lastPoint.x, y: interpolatedY });
        }
      }
    }

    processedData[rangeKey] = averagedData;
  });

  return processedData;
};

// Utility function to create common fields
const createCommonFields = () => ({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});

// Reusable function to create a new price entry
const createNewPriceEntry = (price) => ({
  num: price,
  timestamp: new Date(),
});

// Common pre-save logic for updating totals
async function updateTotals(cardModel, cardsField) {
  this.totalPrice = 0;
  this.totalQuantity = 0;
  if (this[cardsField] && this[cardsField].length > 0) {
    const items = await cardModel.find({ _id: { $in: this[cardsField] } });
    for (const item of items) {
      this.totalPrice += item.price * item.quantity;
      this.totalQuantity += item.quantity;
    }
  }
}

const commonSchemaOptions = { timestamps: true };

// Schemas
const DeckSchema = new Schema(
  {
    ...createCommonFields(),
    name: String,
    description: String,
    tags: [String],
    color: String,
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInDeck' }],
  },
  commonSchemaOptions,
);

DeckSchema.pre('save', function (next) {
  updateTotals.call(this, mongoose.model('CardInDeck'), 'cards').then(next);
});

const CartSchema = new Schema(
  {
    ...createCommonFields(),
    cart: [{ type: Schema.Types.ObjectId, ref: 'CardInCart' }],
  },
  commonSchemaOptions,
);

CartSchema.pre('save', function (next) {
  updateTotals.call(this, mongoose.model('CardInCart'), 'cart').then(next);
});

const CollectionSchema = new Schema(
  {
    ...createCommonFields(),
    name: String,
    description: String,
    dailyPriceChange: Number,
    dailyPercentageChange: String,
    newTotalPrice: Number,

    collectionStatistics: {
      highPoint: Number,
      lowPoint: Number,
      avgPrice: Number,
      percentageChange: Number,
      priceChange: Number,
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
    priceChangeHistory: [
      {
        timestamp: Date,
        priceChanges: [
          {
            collectionName: String,
            cardName: String,
            oldPrice: Number,
            newPrice: Number,
            priceDifference: Number,
            message: String,
          },
        ],
        difference: Number,
      },
    ],
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
    newNivoChartData: [
      {
        id: String,
        color: String,
        data: [{ x: Date, y: Number }],
      },
    ],
    averagedChartData: {
      type: Map,
      of: [dataPointSchema], // Use this if your data points follow a consistent schema
    },
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
  commonSchemaOptions,
);
CollectionSchema.pre('save', async function (next) {
  try {
    console.log('pre save hook for collection', this.name);
    const currentTotalPrice = this.totalPrice;
    this.totalPrice = 0;
    this.newTotalPrice = 0;
    this.totalQuantity = 0;
    this.collectionStatistics = {
      highPoint: 0,
      avgPrice: 0,
      lowPoint: Infinity,
      percentageChange: 0,
      priceChange: 0,
    };
    this.nivoChartData = [{ id: this.name, color: '#2e7c67', data: [] }];
    this.muiChartData = [];
    const initialTotalPrice = currentTotalPrice; // Example placeholder, adjust as needed
    const calculatePriceAndPercentChange = (priceChangeHistory, initialTotalPrice) => {
      const totalDifference = priceChangeHistory.reduce(
        (acc, entry) =>
          acc +
          entry.priceChanges.reduce((entryAcc, change) => entryAcc + change.priceDifference, 0),
        0,
      );
      const finalTotalPrice = initialTotalPrice + totalDifference;
      // this.totalPrice += totalDifference; // This line applies the calculated price difference to the total price.

      const percentChange = initialTotalPrice ? (totalDifference / initialTotalPrice) * 100 : 0;
      return {
        totalDifference,
        percentChange: parseFloat(percentChange.toFixed(2)),
        finalTotalPrice,
      };
    };
    const { totalDifference, percentChange, finalTotalPrice } = calculatePriceAndPercentChange(
      this.priceChangeHistory,
      initialTotalPrice,
    );
    this.newTotalPrice = finalTotalPrice;

    Object.assign(this.collectionStatistics, {
      priceChange: totalDifference,
      percentageChange: parseFloat(percentChange.toFixed(2)),
    });
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
          this.nivoChartData[0].data.push({
            x: new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000), // 6 hours ahead of lastXValue
            y: runningTotalPrice,
          });
          lastXValue = new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000); // Update lastXValue
        }
        const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
        const sevenDays = this.collectionPriceHistory.filter(
          (entry) => entry.timestamp >= sevenDaysAgo,
        );
        const highPoint = sevenDays.reduce((acc, entry) => Math.max(acc, entry.num), 0);
        const lowPoint = sevenDays.reduce(
          (acc, entry) => (acc === 0 ? entry.num : Math.min(acc, entry.num)),
          Infinity,
        );
        this.collectionStatistics.highPoint = Math.max(
          this.collectionStatistics.highPoint,
          highPoint,
        );
        this.collectionStatistics.avgPrice = this.collectionPriceHistory / 2;
        this.collectionStatistics.lowPoint = Math.min(this.collectionStatistics.lowPoint, lowPoint);
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
      updatePriceHistory(this);
      await updateMUIChartData(this);
      const twentyFourHourAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000);
      const oneEightyDaysAgo = new Date(new Date().getTime() - 180 * 24 * 60 * 60 * 1000);
      const twoSeventyDaysAgo = new Date(new Date().getTime() - 270 * 24 * 60 * 60 * 1000);
      const threeSixtyFiveDaysAgo = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);
      const oneDay = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= twentyFourHourAgo,
      );
      const sevenDays = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= sevenDaysAgo,
      );
      const thirtyDays = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= thirtyDaysAgo,
      );
      const ninetyDays = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= ninetyDaysAgo,
      );
      const oneEightyDays = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= oneEightyDaysAgo,
      );
      const twoSeventyDays = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= twoSeventyDaysAgo,
      );
      const threeSixtyFiveDays = this.collectionPriceHistory.filter(
        (entry) => entry.timestamp >= threeSixtyFiveDaysAgo,
      );
      const timeRanges = {
        '24h': oneDay,
        '7d': sevenDays,
        '30d': thirtyDays,
        '90d': ninetyDays,
        '180d': oneEightyDays,
        '270d': twoSeventyDays,
        '365d': threeSixtyFiveDays,
      };
      const processedData = groupAndAverageDataForRanges(this.nivoChartData[0].data, timeRanges);
      this.averagedChartData = processedData;
      this.newNivoChartData = Object.keys(processedData)?.map((timeRangeKey, index) => {
        console.log('TIME RANGE KEY', timeRangeKey);
        const datapoints = processedData[timeRangeKey];
        const convertedDatapoints = datapoints.map((datapoint) => ({
          y: datapoint.y,
          x: new Date(datapoint.x), // This converts the ISO string to a Date object
        }));
        console.log('DATAPOINT', convertedDatapoints);
        return {
          id: `${timeRangeKey}`, // Unique ID for each chart data series
          color: '#2e7c67', // Example color, adjust as needed
          data: convertedDatapoints,
        };
      });
      this.markModified('averagedChartData');
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
async function updateMUIChartData(collection) {
  const allCollections = await collection.model('Collection').find().populate('cards');
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

  collection.muiChartData = allCollections.map((coll, index) => ({
    id: coll._id,
    label: `${coll.name} - ${coll.totalPrice} - ${index}`,
    value: coll.totalPrice,
    color: colors[index % colors.length],
  }));
}

function updateChartData(dataArray, card, lastXValue) {
  for (let i = 0; i < card.quantity; i++) {
    dataArray.push({
      x: new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000), // Simulate time progression
      y: card.price * (i + 1),
    });
    lastXValue = new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000);
  }
  return lastXValue;
}

function updatePriceHistory(collection) {
  const now = new Date();
  collection.dailyCollectionPriceHistory.push({ timestamp: now, price: collection.totalPrice });

  const lastEntry = collection.collectionPriceHistory[collection.collectionPriceHistory.length - 1];
  if (!lastEntry || significantPriceChange(lastEntry.price, collection.totalPrice)) {
    collection.collectionPriceHistory.push({ timestamp: now, price: collection.totalPrice });
  }
}
function significantPriceChange(lastPrice, newPrice) {
  // Define the criteria for a significant price change
  // Example: price change more than 10%
  return Math.abs(newPrice - lastPrice) / lastPrice > 0.1;
}

// const Deck = model('Deck', DeckSchema);
// const Cart = model('Cart', CartSchema);
// const Collection = model('Collection', CollectionSchema);
// const SearchHistory = model(
//   'SearchHistory',
//   new Schema(
//     {
//       userId: { type: Schema.Types.ObjectId, ref: 'User' },
//       sessions: [searchSessionSchema],
//       // Create new cards field which references all unique cards in all sessions
//       cards: [{ type: Schema.Types.ObjectId, ref: 'CardInSearch' }],
//     },
//     { timestamps: true },
//   ),
// );
module.exports = {
  Deck: model('Deck', DeckSchema),
  Cart: model('Cart', CartSchema),
  Collection: model('Collection', CollectionSchema),
  SearchHistory: model(
    'SearchHistory',
    new Schema(
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        sessions: [searchSessionSchema],
        cards: [{ type: Schema.Types.ObjectId, ref: 'CardInSearch' }],
      },
      { timestamps: true },
    ),
  ),
  // Other models as needed
};
