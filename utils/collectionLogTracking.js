const fs = require('fs');
require('colors');

// Directory for logs
const logsDir = './logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const processCollection = (collection) => {
  let logContent = '';

  // Append structured log entry for the file
  console.log(`[COLLECTION NAME] ${collection.name}`.blue);
  logContent += `[COLLECTION NAME] ${collection.name}\n`;

  // Append structured log entry for the file
  console.log(`[DESCRIPTION] ${collection.description}`);
  logContent += `[DESCRIPTION] ${collection.description}\n`;

  // Append structured log entry for the file
  console.log(`[TOTAL COST] $${collection.totalCost}`);
  logContent += `[TOTAL COST] $${collection.totalCost}\n`;

  // Append structured log entry for the file
  console.log(`[TOTAL PRICE] $${collection.totalPrice}`);
  logContent += `[TOTAL PRICE] $${collection.totalPrice.toFixed(2)}\n`;

  // Append structured log entry for the file
  console.log(`[QUANTITY] ${collection.quantity}`);
  logContent += `[QUANTITY] ${collection.quantity}\n`;

  // Append structured log entry for the file
  console.log(`[TOTAL QUANTITY] ${collection.totalQuantity}`);
  logContent += `[TOTAL QUANTITY] ${collection.totalQuantity}\n`;

  // Append structured log entry for the file
  console.log(`[PREVIOUS DAY TOTAL PRICE] $${collection.previousDayTotalPrice}`);
  logContent += `[PREVIOUS DAY TOTAL PRICE] $${collection.previousDayTotalPrice.toFixed(2)}\n`;

  // Append structured log entry for the file
  console.log(`[DAILY PRICE CHANGE] $${collection.dailyPriceChange}`);
  logContent += `[DAILY PRICE CHANGE] $${collection.dailyPriceChange.toString()}\n`;

  // Append structured log entry for the file
  console.log(`[PRICE DIFFERENCE] $${collection.priceDifference}`);
  logContent += `[PRICE DIFFERENCE] $${collection.priceDifference.toFixed(2)}\n`;

  // Append structured log entry for the file
  console.log(`[PRICE CHANGE] ${collection.priceChange}%\n`);
  logContent += `[PRICE CHANGE] ${collection.priceChange.toFixed(2)}%\n\n`;

  console.log('[CARDS IN COLLECTION]'.magenta);
  logContent += '[CARDS IN COLLECTION]\n';

  let cardsChanged = false;
  collection.cards.forEach((card, index) => {
    const latestPrice = parseFloat(card.latestPrice?.num ?? 0).toFixed(2);
    const lastSavedPrice = parseFloat(card.lastSavedPrice?.num ?? 0).toFixed(2);

    // Only log if the price has changed
    if (latestPrice !== lastSavedPrice) {
      cardsChanged = true;
      const priceChange = (latestPrice - lastSavedPrice).toFixed(2);
      const status = priceChange > 0 ? 'increased' : priceChange < 0 ? 'decreased' : 'unchanged';
      const statusColor =
        status === 'increased' ? 'green' : status === 'decreased' ? 'red' : 'grey';

      console.log(`    [CARD ${index}] ${card.name}`[statusColor]);
      logContent += `    [CARD ${index}] ${card.name}\n`;
      logContent += `        [LATEST PRICE] $${latestPrice}\n`;
      logContent += `        [LAST SAVED PRICE] $${lastSavedPrice}\n`;
      logContent += `        [CHANGE] ${priceChange} (${status})\n`;
      logContent += `        [QUANTITY] ${card.quantity}\n\n`;
    }
  });

  if (!cardsChanged) {
    console.log('No changes in card prices.');
    logContent += 'No changes in card prices.\n';
  }

  console.log('[CHART DATA]'.cyan);
  // collection.chartData.datasets.forEach((dataset, index) => {
  //   console.log(`    [DATASET ${index}] ${dataset.name}`);
  //   dataset.data.forEach((dataEntry, dataIndex) => {
  //     // Note: Assuming dataEntry is an object containing an array 'xys'
  //     dataEntry.xys.forEach((xy, xyIndex) => {
  //       console.log(`        [DATA ${dataIndex} - XY ${xyIndex}] x: ${xy.data.x}, y: ${xy.data.y}`);
  //     });
  //   });
  // });

  return logContent;
};

function logCollection(collection) {
  try {
    if (typeof collection !== 'object' || collection === null) {
      throw new Error('Invalid collection data provided for logging.');
    }

    let logContent = '----- Collection Data Log -----\n\n';
    logContent += processCollection(collection);
    logContent += '----- End of Collection Data Log -----\n\n';

    fs.appendFileSync(`${logsDir}/collection-data-logs.log`, logContent, (err) => {
      if (err) throw err;
    });

    console.log('Collection data logged successfully.'.green);
  } catch (error) {
    console.error(`[ERROR] Failed to log collection data: ${error.message}`.red);
    fs.appendFileSync(
      `${logsDir}/error.log`,
      `[${new Date().toISOString()}] ${error.stack}\n`,
      (err) => {
        if (err) console.error(`[ERROR] Failed to write to error log file: ${err.message}`.red);
      },
    );
  }
}
module.exports = { logCollection };
