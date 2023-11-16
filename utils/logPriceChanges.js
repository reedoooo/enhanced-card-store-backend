const fs = require('fs');
require('colors');

// Directory for logs
const logsDir = './logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
function logData(data) {
  if (!data || !Array.isArray(data)) {
    console.error('Data must be an array.'.red);
    return;
  }

  let logContent = '----- Card Data Log -----\n\n';

  data.forEach((card, index) => {
    const latestPrice = parseFloat(card.latestPrice?.num ?? 0);
    const lastSavedPrice = parseFloat(card.lastSavedPrice?.num ?? 0);
    const priceChange = latestPrice - lastSavedPrice;
    const percentageChange = (priceChange / lastSavedPrice) * 100;
    const statusColor = priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'grey';
    const status = priceChange > 0 ? 'increased' : priceChange < 0 ? 'decreased' : 'unchanged';

    console.log(`[${index}] [CARD NAME] ${card.name}`[statusColor]);
    console.log(`    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}`);
    console.log(`    [UPDATED PRICE]  $${latestPrice.toFixed(2)}`);
    console.log(`    [CHANGE]         ${priceChange.toFixed(2)} (${status})`);
    console.log(`    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})`);
    console.log(`    [STATUS]         ${status}\n`);

    logContent += `[${index}] [CARD NAME] ${card.name}\n`;
    logContent += `    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}\n`;
    logContent += `    [UPDATED PRICE]  $${latestPrice.toFixed(2)}\n`;
    logContent += `    [CHANGE]         ${priceChange.toFixed(2)} (${status})\n`;
    logContent += `    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})\n`;
    logContent += `    [STATUS]         ${status}\n\n`;
  });

  logContent += '----- End of Log -----\n\n';
  fs.appendFileSync(`${logsDir}/card-data.log`, logContent, (err) => {
    if (err) console.error('Error writing to log file'.red);
  });
}

function logError(error, problematicValue = null) {
  let errorContent = `----- Error Log -----\n\n[ERROR] ${new Date().toISOString()}\n`;

  if (problematicValue) {
    errorContent += `[Problematic Value]: ${JSON.stringify(problematicValue, null, 2)}\n`;
  }

  errorContent += `[Message]: ${error.message}\n`;
  errorContent += `[Stack]:\n${error.stack}\n`;
  errorContent += '----- End of Error Log -----\n\n';

  console.error(errorContent.red);
  fs.appendFileSync(`${logsDir}/error.log`, errorContent.replace(/\[\d+m/g, ''), (err) => {
    if (err) console.error('Error writing to error log file'.red);
  });
}
// i.e.: logPriceChanges.setInitialTotalPrice(100);
// i.e.: logPriceChanges.resetLivePrices();
// i.e.: logPriceChanges.logPriceChanges(pricingData.updatedPrices);

module.exports = {
  logData,
  logError,
  // setInitialTotalPrice: (price) => {
  //   if (typeof price === 'number') {
  //     initialTotalPrice = price;
  //     liveTotalPrice = price;
  //     livePriceChangePercentage = 0;
  //   }
  // },
  // resetLivePrices: () => {
  //   liveTotalPrice = initialTotalPrice;
  //   livePriceChangePercentage = 0;
  // },
};

// function logDataInOrganizedFashion(data) {
//   if (!data || !Array.isArray(data)) {
//     console.error('[logDataInOrganizedFashion] -----> Invalid data provided for logging.');
//     return;
//   }

//   let logContent = 'Logging Card Data:\n\n';

//   data.forEach((card, index) => {
//     const latestPrice =
//       typeof card.latestPrice === 'object' && card.latestPrice.num
//         ? parseFloat(card.latestPrice.num)
//         : 0;
//     const lastSavedPrice =
//       typeof card.lastSavedPrice === 'object' && card.lastSavedPrice.num
//         ? parseFloat(card.lastSavedPrice.num)
//         : 0;
//     const { name, id, tag, status } = card;
//     const priceChange = latestPrice - (lastSavedPrice || latestPrice);
//     // const priceDifference = latestPrice - lastSavedPrice;
//     const priceChangeFormatted = priceChange.toFixed(2);
//     const timestamp = new Date().toLocaleString();

//     let statusMessage = `Status: ${status}`;
//     let priceMessage = `Latest Price: $${latestPrice.toFixed(2)} (Change: ${priceChangeFormatted})`;

//     switch (status) {
//       case 'increased':
//         statusMessage = statusMessage.green;
//         priceMessage = priceMessage.green;
//         break;
//       case 'decreased':
//         statusMessage = statusMessage.red;
//         priceMessage = priceMessage.red;
//         break;
//       case 'unchanged':
//         statusMessage = statusMessage.yellow;
//         priceMessage = priceMessage.yellow;
//         break;
//       default:
//         statusMessage = statusMessage.white;
//         priceMessage = priceMessage.white;
//     }

//     console.log(`[${index}] Name: ${name} (ID: ${id}, Tag: ${tag})`.cyan);
//     console.log(`    ${statusMessage}`);
//     console.log(`    ${priceMessage}`);
//     console.log(`    Logged at: ${timestamp}\n`);

//     // For file logging (without color codes)
//     logContent += `[${index}] Name: ${name} (ID: ${id}, Tag: ${tag})\n`;
//     logContent += `    Status: ${status}\n`;
//     logContent += `    Latest Price: $${latestPrice.toFixed(
//       2,
//     )} (Change: ${priceChangeFormatted})\n`;
//     logContent += `    Logged at: ${timestamp}\n\n`;
//   });

//   // console.log(statusMessage);
//   // Append additional data to the message if needed and log it to the file
//   fs.appendFileSync(`${logsDir}/price-changes.log`, +logContent + '\n');
//   // fs.appendFileSync(`${logsDir}/price-changes.log`, +logContent + '\n');
// }
