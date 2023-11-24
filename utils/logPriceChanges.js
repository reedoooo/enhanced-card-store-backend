const fs = require('fs');
require('colors');

// Directory for logs
const logsDir = './logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
// function logData(data) {
//   if (!data || !Array.isArray(data)) {
//     console.error('Data must be an array.'.red);
//     return;
//   }

//   let logContent = '----- Card Data Log -----\n\n';

//   data.forEach((card, index) => {
//     const latestPrice = parseFloat(card.latestPrice?.num ?? 0);
//     const lastSavedPrice = parseFloat(card.lastSavedPrice?.num ?? 0);
//     const priceChange = latestPrice - lastSavedPrice;
//     const percentageChange = (priceChange / lastSavedPrice) * 100;
//     const statusColor = priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'grey';
//     const status = priceChange > 0 ? 'increased' : priceChange < 0 ? 'decreased' : 'unchanged';

//     console.log(`[${index}] [CARD NAME] ${card.name}`[statusColor]);
//     console.log(`    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}`);
//     console.log(`    [UPDATED PRICE]  $${latestPrice.toFixed(2)}`);
//     console.log(`    [QUANTITY]         ${card?.quantity} (${status})`);
//     console.log(`    [CHANGE]         ${priceChange.toFixed(2)} (${status})`);
//     console.log(`    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})`);
//     console.log(`    [STATUS]         ${status}\n`);

//     logContent += `[${index}] [CARD NAME] ${card.name}\n`;
//     logContent += `    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}\n`;
//     logContent += `    [UPDATED PRICE]  $${latestPrice.toFixed(2)}\n`;
//     logContent += `    [QUANTITY]         ${card?.quantity} (${status})\n`;
//     logContent += `    [CHANGE]         ${priceChange.toFixed(2)} (${status})\n`;
//     logContent += `    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})\n`;
//     logContent += `    [STATUS]         ${status}\n\n`;
//   });

//   logContent += '----- End of Log -----\n\n';
//   fs.appendFileSync(`${logsDir}/card-data.log`, logContent, (err) => {
//     if (err) console.error('Error writing to log file'.red);
//   });
// }
const processCard = (data) => {
  let logContent = '----- Card Data Log -----\n\n';
  const cards = Array.isArray(data) ? data : [data]; // Handle both single and multiple cards

  // if (!data || !Array.isArray(data)) {
  //   console.error('Data must be an array.'.red);
  //   return;
  // }
  // let logContent = '';

  cards.forEach((card, index) => {
    const latestPrice = parseFloat(card.latestPrice?.num ?? 0);
    const lastSavedPrice = parseFloat(card.lastSavedPrice?.num ?? 0);
    const priceChange = latestPrice - lastSavedPrice;
    const percentageChange = (priceChange / lastSavedPrice) * 100;
    const statusColor = priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'grey';
    const status = priceChange > 0 ? 'increased' : priceChange < 0 ? 'decreased' : 'unchanged';

    console.log(`[${index}] [CARD NAME] ${card.name}`[statusColor]);
    console.log(`    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}`);
    console.log(`    [UPDATED PRICE]  $${latestPrice.toFixed(2)}`);
    console.log(`    [QUANTITY]         ${card?.quantity} (${status})`);
    console.log(`    [CHANGE]         ${priceChange.toFixed(2)} (${status})`);
    console.log(`    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})`);
    console.log(`    [STATUS]         ${status}\n`);

    logContent += `[${index}] [CARD NAME] ${card.name}\n`;
    logContent += `    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}\n`;
    logContent += `    [UPDATED PRICE]  $${latestPrice.toFixed(2)}\n`;
    logContent += `    [QUANTITY]         ${card?.quantity} (${status})\n`;
    logContent += `    [CHANGE]         ${priceChange.toFixed(2)} (${status})\n`;
    logContent += `    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})\n`;
    logContent += `    [STATUS]         ${status}\n\n`;
  });

  logContent += '----- End of Log -----\n\n';
  fs.appendFileSync(`${logsDir}/card-data.log`, logContent, (err) => {
    if (err) console.error('Error writing to log file'.red);
  });

  return logContent;
};

module.exports = { processCard };

// module.exports = { logData };
