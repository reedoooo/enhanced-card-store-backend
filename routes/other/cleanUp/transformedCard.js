// const colors = require('colors');
// const { getIO } = require('../../../socket');
// const { ChartData } = require('../../../models/ChartData');
// const { User } = require('../../../models/User');
// const { Collection } = require('../../../models/Collection'); // Assuming you have a Collection model

// const transformCard = async (card, userId, collectionId, chartId) => {
//   const {
//     cardName,
//     y: updatedPrice,
//     totalQuantity: cardQuantity,
//     totalPrice: totalCardPrice,
//   } = card || {};

//   const existingCard = await ChartData.findOne({ 'datasets.data.points.cardName': cardName });

//   if (!existingCard && (!cardName || !updatedPrice)) {
//     console.error(
//       'No existing card found and dataPoints.y is also missing for cardName:',
//       cardName,
//     );
//     return null;
//   }

//   const initialPrice = existingCard?.updatedPrice || updatedPrice;
//   const priceDifference = updatedPrice - initialPrice;
//   const priceChange = priceDifference / (initialPrice || 1);
//   const priceChanged = priceDifference !== 0;
//   // const cardQuantity = cardQuantity || 1;
//   const roundedPriceChange = Math.round(priceChange * 100) / 100;

//   return {
//     userId,
//     collectionId,
//     chartId,
//     cardData: {
//       cardName, // I added this so we know the name in the transformed data.
//       initialPrice,
//     },
//     cardInfoData: {
//       updatedPrice: updatedPrice,
//       cardQuantity: cardQuantity,
//       totalCardPrice: totalCardPrice,
//       priceDifference: priceDifference,
//       priceChanged: priceChanged,
//       roundedPriceChange: roundedPriceChange,
//     },
//   };
// };

// const transformedDataSets = async (cards, card, cardInfo, userId, collectionId) => {
//   // if (!collection || !Array.isArray(collection?.cards)) {
//   //   console.error('Invalid collection or missing cards array in transformedDataSets.');
//   //   return [];
//   // }
//   console.log('+++++++++++++++++++Cards:', cards);
//   // Find existing chart for the collection
//   const existingChart = await ChartData.findOne({ collectionId });
//   // const collectionFromId = await Collection.findById(collectionId);
//   console.log('+++++++++++++++++++ExistingChart:', existingChart);

//   const transformedCards = await Promise.all(
//     cards?.map((card) => transformCard(card, userId, collectionId, existingChart?.data?._id)),
//   );
//   console.log('+++++++++++++++++++TransformedCards:', transformedCards);
//   // If there's an existing chart, update it, otherwise create a new chart.
//   let savedChartData;
//   if (existingChart) {
//     existingChart.datasets = [...existingChart.datasets, ...transformedCards];
//     await existingChart.save();
//     savedChartData = existingChart;
//   } else {
//     const chartData = {
//       userId,
//       collectionId,
//       datasets: transformedCards,
//     };
//     savedChartData = new ChartData(chartData);
//     await savedChartData.save((err) => {
//       if (err) {
//         console.error('Error saving chartData:', err);
//       }
//     });
//     // Verify that savedChartData has an _id
//     if (!savedChartData._id) {
//       console.error('Failed to save chartData. No _id returned:', savedChartData);
//       return null; // Or handle this case as per your requirements.
//     }
//   }

//   // const user = await User.findById(userId);
//   // if (user && Array.isArray(user.allDataSets)) {
//   //   user.allDataSets.push(savedChartData._id);
//   //   await user.save();
//   // } else {
//   //   throw new Error('allDataSets is not defined or not an array on the user object');
//   // }

//   const data = {
//     savedChartData,
//   };

//   const io = getIO();
//   io.emit('CARD_STATS_UPDATE', data);
//   return { savedChartData, data, transformedCards };
// };
// module.exports = { transformedDataSets, transformCard };
