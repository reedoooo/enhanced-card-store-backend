// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const DataPointSchema = new Schema({
//   cardName: String,
//   x: Date,
//   y: Number,
//   priceChange: Number,
//   priceChangePercentage: Number,
//   totalQuantity: Number,
//   totalPrice: Number,
//   _id: mongoose.Schema.Types.ObjectId,
// });

// const DataSetSchema = new Schema({
//   label: String,
//   backgroundColor: String,
//   borderColor: String,
//   borderWidth: Number,
//   data: [DataPointSchema],
// });

// const ChartDataSchema = new Schema({
//   _id: mongoose.Schema.Types.ObjectId,
//   name: String,
//   userId: {
//     type: String,
//     required: true,
//     ref: 'User',
//   },
//   userIdObject: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   collectionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Collection',
//   },
//   chartId: {
//     type: mongoose.Schema.Types.ObjectId,
//     // required: false,
//   },
//   datasets: [DataSetSchema],
// });

// const AllCollectionDataSchema = new Schema({
//   data: [ChartDataSchema],
// });

// const ChartData = mongoose.model('ChartData', ChartDataSchema);
// const AllCollectionDataModel = mongoose.model('AllCollectionData', AllCollectionDataSchema);

// module.exports = {
//   ChartDataSchema,
//   AllCollectionDataSchema,
//   ChartData,
//   AllCollectionDataModel,
// };

// // const mongoose = require('mongoose');
// // const { Schema } = mongoose;

// // const DataPointSchema = new Schema({
// //   cardName: String,
// //   x: Date,
// //   y: Number,
// //   priceChange: Number,
// //   priceChangePercentage: Number,
// //   totalQuantity: Number,
// //   totalPrice: Number,
// //   _id: mongoose.Schema.Types.ObjectId,
// // });

// // const DataSetSchema = new Schema({
// //   label: String,
// //   totalquantity: Number,
// //   data: {
// //     points: [DataPointSchema],
// //   },
// //   backgroundColor: String,
// //   borderColor: String,
// //   borderWidth: Number,
// //   // _id: false,
// // });

// // const ChartDataSchema = new Schema({
// //   _id: mongoose.Schema.Types.ObjectId,
// //   name: String,
// //   userId: {
// //     type: String,
// //     required: true,
// //     ref: 'User',
// //   },
// //   userIdObject: {
// //     type: Schema.Types.ObjectId,
// //     ref: 'User',
// //   },
// //   collectionId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Collection',
// //   },
// //   chartId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     required: false,
// //   },
// //   datasets: [DataSetSchema],
// // });

// // const AllCollectionDataSchema = new Schema({
// //   data: [ChartDataSchema],
// // });

// // const ChartData = mongoose.model('ChartData', ChartDataSchema);
// // const AllCollectionDataModel = mongoose.model('AllCollectionData', AllCollectionDataSchema);

// // module.exports = {
// //   ChartDataSchema,
// //   AllCollectionDataSchema,
// //   ChartData,
// //   AllCollectionDataModel,
// // };

// // const mongoose = require('mongoose');
// // const { Schema } = mongoose;

// // const DataPointSchema = new Schema({
// //   x: Date, // Use Mixed if x can be different types, otherwise specify the type
// //   y: mongoose.Schema.Types.Mixed, // Use Mixed if y can be different types, otherwise specify the type
// //   _id: false,
// //   priceChanged: {
// //     type: Boolean,
// //     required: false,
// //   },
// //   cardName: {
// //     type: String,
// //     required: false,
// //   },
// //   cardId: {
// //     type: String,
// //     ref: 'Card',
// //     required: false,
// //   },
// //   priceDifference: {
// //     type: Number,
// //     required: false,
// //   },
// // });

// // const ChartDataSchema = new Schema({
// //   _id: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     auto: true,
// //   },
// //   name: {
// //     type: String,
// //     required: false,
// //   },
// //   chartId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     required: false,
// //   },
// //   collectionId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     required: false,
// //     ref: 'Collection',
// //   },
// //   userId: {
// //     type: String,
// //     required: true,
// //     ref: 'User',
// //     // unique: true, // This ensures `userId` is unique across all documents in your collection
// //   },
// //   userIdObject: {
// //     // type: mongoose.Schema.Types.ObjectId,
// //     type: Schema.Types.ObjectId,
// //     required: false,
// //     ref: 'User',
// //     // unique: true, // This ensures `userId` is unique across all documents in your collection
// //   },
// //   datasets: [DataPointSchema],
// // });

// // const AllCollectionDataSchema = new Schema({
// //   data: [ChartDataSchema],
// // });

// // // Models
// // const ChartData = mongoose.model('ChartData', ChartDataSchema);
// // // module.exports = mongoose.model('ChartData', ChartDataSchema);

// // const AllCollectionDataModel = mongoose.model('AllCollectionData', AllCollectionDataSchema);

// // // Export Schemas and Models
// // module.exports = {
// //   ChartDataSchema,
// //   AllCollectionDataSchema,
// //   ChartData,
// //   AllCollectionDataModel,
// // };
