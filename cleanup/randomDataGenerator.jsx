// function generateRandomDataSets(
//   baseDate,
//   baseY,
//   incrementType,
//   totalPoints,
//   finalY
// ) {
//   const incrementMap = {
//     "24h": 1 / 24, // Increment by hour
//     "7d": 1, // Increment by day
//     "30d": 1,
//     "90d": 3,
//     "180d": 6,
//     "270d": 9,
//     "365d": 12,
//   };

//   const dataSets = [];
//   let currentDate = new Date(baseDate);
//   let currentY = baseY;
//   const yIncrement = (finalY - baseY) / totalPoints;

//   for (let i = 0; i < totalPoints; i++) {
//     dataSets.push({
//       _id: generateRandomId(), // Implement this function to generate unique IDs
//       x: currentDate.toISOString(),
//       y: parseFloat((currentY += yIncrement * Math.random() * 2).toFixed(2)), // Randomize the increment a bit
//     });

//     currentDate = new Date(
//       currentDate.getTime() + incrementMap[incrementType] * 24 * 60 * 60 * 1000
//     );
//   }

//   return dataSets;
// }

// function generateRandomId() {
//   return Math.floor(Math.random() * Date.now()).toString(16);
// }
// // Base parameters
// const backupBaseDate = "2024-02-25T10:13:43.410Z";
// const baseDate = new Date(
//   new Date().getTime() - 7 * 24 * 60 * 60 * 1000
// ).toISOString();
// const startValue = 3.99;
// const endValue1 = 107.93;
// const endValue2 = 257.56;
// const endValue3 = 399.99;
// const endValue4 = 500.0;
// const endValue5 = 875.59;
// const endValue6 = 1578.43;
// const endValue7 = 2745.32;

// // Generate datasets for each time range
// const data24h = generateRandomDataSets(
//   baseDate,
//   startValue,
//   "24h",
//   24,
//   endValue1
// );
// const data7d = generateRandomDataSets(baseDate, startValue, "7d", 7, endValue2);
// const data30d = generateRandomDataSets(
//   baseDate,
//   startValue,
//   "30d",
//   30,
//   endValue3
// );
// const data90d = generateRandomDataSets(
//   baseDate,
//   startValue,
//   "90d",
//   30,
//   endValue4
// );
// const data180d = generateRandomDataSets(
//   baseDate,
//   startValue,
//   "180d",
//   30,
//   endValue5
// );
// const data270d = generateRandomDataSets(
//   baseDate,
//   startValue,
//   "270d",
//   30,
//   endValue6
// );
// const data365d = generateRandomDataSets(
//   baseDate,
//   startValue,
//   "365d",
//   30,
//   endValue7
// );

// const convertToNivoFormat = (timeRange, data) => {
//   return data.map((dataPoint) => {
//     return {
//       id: timeRange,
// 			color: "#2e7c67", // Example color, adjust as needed
//       data: [
// 				{
// 					x: dataPoint.x,
// 					y: dataPoint.y,
// 				},
// 			],
//     };
//   });
// };

// const convertAllToNivoFormat = () => {
// 	return [
//     convertToNivoFormat("24h", data24h),
//     convertToNivoFormat("7d", data7d),
//     convertToNivoFormat("30d", data30d),
//     convertToNivoFormat("90d", data90d),
//     convertToNivoFormat("180d", data180d),
//     convertToNivoFormat("270d", data270d),
//     convertToNivoFormat("365d", data365d),
//   ];
// };


// // Example to print the generated dataset for "24h"
// console.log("24h data set:", data24h);

// function generateJsonDocument() {
//   const allDataSets = {
//     '24h': data24h,
//     '7d': data7d,
//     '30d': data30d,
//     '90d': data90d,
//     '180d': data180d,
//     '270d': data270d,
//     '365d': data365d,
//   };

//   return JSON.stringify(allDataSets, null, 2); // Beautify the JSON output
// }

// module.exports = {
// 	generateJsonDocument,
//   convertAllToNivoFormat,
//   generateRandomDataSets,
// 	convertToNivoFormat,
// 	convertAllToNivoFormat,
//   data24h,
//   data7d,
//   data30d,
//   data90d,
//   data180d,
//   data270d,
//   data365d,
// };
