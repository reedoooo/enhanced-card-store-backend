// const mongoose = require('mongoose');
// const { Schema } = mongoose;
// // Import the CardInCollection model
// const CardInCollection = require('./CardInCollection'); // Adjust the path as per your project structure

// const priceEntrySchema = new mongoose.Schema({
//   num: {
//     type: Number,
//     required: false,
//   },
//   timestamp: {
//     type: Date,
//     required: true,
//   },
// });
// const collectionPriceHistorySchema = new mongoose.Schema({
//   timestamp: {
//     type: Date,
//     required: true,
//   },
//   num: {
//     type: Number,
//     required: false,
//   },
// });

// const collectionSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   name: String,
//   description: String,
//   totalPrice: Number,
//   quantity: Number,
//   totalQuantity: Number,
//   previousDayTotalPrice: Number,
//   dailyPriceChange: String,
//   priceDifference: Number,
//   priceChange: Number,
//   latestPrice: priceEntrySchema,
//   lastSavedPrice: priceEntrySchema,
//   collectionPriceHistory: [collectionPriceHistorySchema],
//   dailyCollectionPriceHistory: [collectionPriceHistorySchema],
//   cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CardInCollection' }], // Reference to CardInCollection
//   currentChartDataSets2: [
//     {
//       label: String,
//       x: Date,
//       y: Number,
//     },
//   ],
//   chartData: {
//     name: String,
//     userId: { type: Schema.Types.ObjectId, ref: 'User' },
//     // datasets: [DatasetSchema],
//     allXYValues: [
//       {
//         label: String,
//         x: Date,
//         y: Number,
//       },
//     ],
//   },
// });

// // Add static methods to the Collection Schema
// collectionSchema.statics = {
//   // Generic method to update the context's stats (totalQuantity and totalPrice)
//   updateContextStats: async function (contextId) {
//     const context = await this.findById(contextId);
//     let totalQuantity = 0;
//     let totalPrice = 0;

//     context.items.forEach((item) => {
//       totalQuantity += item.quantity; // Assumes quantity is defined for each item
//       totalPrice += item.totalPrice; // Assumes totalPrice is calculated and stored for each item
//     });

//     context.totalQuantity = totalQuantity;
//     context.totalPrice = totalPrice;
//     await context.save();
//     return context;
//   },

//   // Update a specific card's quantity, its totalPrice, add a new price history entry,
//   // then update the context's total quantity and total price
//   updateCardDetails: async function (contextId, cardId, setCode, newQuantity) {
//     const context = await this.findById(contextId);
//     const cardIndex = context.items.findIndex(
//       (item) => item.cardVariant.id === cardId && item.cardVariant.setCode === setCode,
//     );

//     if (cardIndex === -1) {
//       throw new Error('Card variant not found in the context');
//     }

//     const card = context.items[cardIndex];
//     const oldQuantity = card.quantity;
//     card.quantity = newQuantity;

//     // Assuming price is defined in the cardVariant
//     card.totalPrice = newQuantity * card.cardVariant.price;

//     // Add new price history entry
//     const currentDate = new Date();
//     card.cardVariant.chart_datasets.push({
//       x: currentDate, // Current timestamp
//       y: card.totalPrice, // New total price based on updated quantity
//     });

//     // Save the updated context (collection, deck, or cart)
//     await context.save();

//     // Update context's total stats if it's a collection
//     if (context instanceof Collection) {
//       const newPriceHistoryEntry = {
//         timestamp: currentDate,
//         num: card.totalPrice, // or other appropriate calculation
//       };
//       context.collectionPriceHistory.push(newPriceHistoryEntry);
//       await context.save();
//     }

//     return this.updateContextStats(contextId); // Update the overall stats of the context
//   },
// };

// module.exports = mongoose.model('Collection', collectionSchema);
