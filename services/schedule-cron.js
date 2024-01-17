const cron = require('node-cron');
const mongoose = require('mongoose');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { Collection } = require('../models/Collection');
const { CardInCollection } = require('../models/Card');
const { populateUserDataByContext } = require('../controllers/User/dataUtils');
const { fetchUserIdsFromUserSecurityData } = require('../controllers/User/helpers');
const { fetchCardPrices } = require('../controllers/Cards/helpers');

// Function to send an email
async function sendEmail(subject, message) {
  console.log('------------------------');
  console.log('Email cron job running...');
  console.log('------------------------');
  // TODO: LEARN WHAT SMTP IS
  // TODO: SET UP ENV VARIABLES FOR SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const emailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.USER_EMAIL,
    subject: subject,
    text: message,
  };
  transporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}
// Function to update Collection dailyCollectionPriceHistory
const updateCollectionPriceHistory = async () => {
  const allUserIds = await fetchUserIdsFromUserSecurityData();

  for (const userId of allUserIds) {
    const userPopulated = await populateUserDataByContext(userId, ['collections']);
    for (const collection of userPopulated.allCollections) {
      const newPrice = collection.cards.reduce(
        (total, card) => total + card.price * card.quantity,
        0,
      );
      collection.dailyCollectionPriceHistory.push({ timestamp: new Date(), price: newPrice });
      await collection.save();
    }
  }
};
// Function to update CardInCollection dailyPriceHistory
const updateCardPriceHistory = async () => {
  const allUserIds = await fetchUserIdsFromUserSecurityData();

  console.log(
    'CRONJOB IS CURRENTLY SETTING UP DAILY PRICE HISTORY ---------------------------------',
  );
  for (const userId of allUserIds) {
    const userPopulated = await populateUserDataByContext(userId, ['collections']);
    for (const collection of userPopulated.allCollections) {
      for (const card of collection.cards) {
        const apiPrice = await fetchCardPrices(card.name); // Implement fetchCardPrices
        if (card.latestPrice.num !== apiPrice) {
          card.dailyPriceHistory.push({ timestamp: new Date(), num: apiPrice });
          card.latestPrice.num = apiPrice;
          await card.save();
        }
      }
    }
  }
};
const populateCardsAndCheckUpdates = async () => {
  const allUserIds = await fetchUserIdsFromUserSecurityData();
  const userPopulated = populateUserDataByContext(userId, ['collections']);
  const collections = await Collection.find({}).populate('cards');
  collections.forEach(async (collection) => {
    collection.cards.forEach(async (card) => {
      const apiPrice = await fetchCardPrices(card.name); // Implement fetchPriceFromAPI
      if (card.latestPrice.num !== apiPrice) {
        card.latestPrice = { num: apiPrice, timestamp: new Date() };
        card.priceHistory.push({ timestamp: new Date(), num: apiPrice });
        await card.save();
      }
    });
    await collection.save();
  });
};
// Function to check and update card prices (Task 3)
const checkAndUpdateCardPrices = async () => {
  const allUserIds = await fetchUserIdsFromUserSecurityData();

  let priceChanges = [];
  for (const userId of allUserIds) {
    const userPopulated = await populateUserDataByContext(userId, ['collections']);
    for (const collection of userPopulated.allCollections) {
      for (const card of collection.cards) {
        const apiPrice = await fetchCardPrices(card.name); // Implement fetchCardPrices
        if (card.latestPrice.num !== apiPrice) {
          card.latestPrice.num = apiPrice;
          card.priceHistory.push({ timestamp: new Date(), num: apiPrice });
          await card.save();
          priceChanges.push(
            `Card: ${card.name}, Old Price: ${card.latestPrice.num}, New Price: ${apiPrice}`,
          );
        } else {
          // Push current value to dailyPriceHistory if no change
          card.dailyPriceHistory.push({ timestamp: new Date(), num: card.latestPrice.num });
          await card.save();
        }
      }
    }
  }

  let emailSubject = 'Card Prices Checked and Updated';
  let emailMessage =
    priceChanges.length > 0
      ? 'Card price changes:\n' + priceChanges.join('\n')
      : 'No card prices have changed.';

  await sendEmail(emailSubject, emailMessage);
};
// Task 1: Update dailyCollectionPriceHistory every 24 hours
cron.schedule('0 0 * * *', updateCollectionPriceHistory);
// Task 2: Update dailyPriceHistory every 24 hours
cron.schedule('0 0 * * *', updateCardPriceHistory);
// Task 3: Every hour, check for price updates
cron.schedule('0 * * * *', checkAndUpdateCardPrices);
// Task 4: Send totalPrice for each collection every 2 hours
cron.schedule('0 */2 * * *', async () => {
  console.log('Sending collection total prices...');
  const collections = await Collection.find({});
  let emailText = 'Collection Total Prices:\n';
  collections.forEach((collection) => {
    `
  emailText += Collection: ${collection.name}, 
  Total Price: ${collection.totalPrice}\n;
  `;
  });
  await sendEmail('Collection Total Prices', emailText);
});
// cron.schedule('* * * * *', () => {
// const cron = require('node-cron');
// const mongoose = require('mongoose');
// const axios = require('axios');
// const Collection = require('./models/Collection'); // Update with your actual path
// const CardInCollection = require('./models/CardInCollection'); // Update with your actual path
// const nodemailer = require('nodemailer');

// // Task 1: Update dailyCollectionPriceHistory every 24 hours
// cron.schedule('0 0 * * *', async () => {
//   // Logic to update dailyCollectionPriceHistory
//   console.log('Running Task 1: Update dailyCollectionPriceHistory');
//   // Your logic goes here
// });

// // Task 2: Update dailyPriceHistory every 24 hours
// cron.schedule('0 0 * * *', async () => {
//   // Logic to update dailyPriceHistory
//   console.log('Running Task 2: Update dailyPriceHistory');
//   // Your logic goes here
// });

// // Task 3: Every hour, populate cards fields and check for price updates
// cron.schedule('0 * * * *', async () => {
//   console.log('Running Task 3: Populate cards and check for price updates');
//   // Fetch all collections
//   const collections = await Collection.find({}); // Update query as needed

//   for (const collection of collections) {
//     for (const cardId of collection.cards) {
//       const card = await CardInCollection.findById(cardId);
//       if (!card) continue;

//       // Fetch card data from API
//       try {
//         const response = await axios.get(`https://api.example.com/cards/${card.id}`); // Replace with actual API call
//         const apiPrice = response.data.price; // Update path according to actual API response

//         if (card.latestPrice.num !== apiPrice) {
//           console.log(
//             `Price updated for card ${card.name}: ${card.latestPrice.num} to ${apiPrice}`,
//           );
//           // Update card with new price and log/save the data
//           card.latestPrice.num = apiPrice;
//           await card.save();
//         }
//       } catch (error) {
//         console.error(`Error fetching data for card ${card.name}:`, error);
//       }
//     }
//   }
// });

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// // Cron job every Saturday at midnight
// cron.schedule('* * * * *', () => {
//   console.log('------------------------');
//   console.log('Email cron job running...');
//   console.log('------------------------');

//   let messageOptions = {
//     from: process.env.SMTP_USER,
//     to: 'justTrying@example.com',
//     subject: 'Cron job test',
//     text: 'Hello! This email was automatically sent by node.js and its cron job.',
//   };

//   transporter.sendMail(messageOptions, (error, info) => {
//     if (error) {
//       if (error.syscall == 'getaddrinfo') {
//         console.log("!!! - Can't connect to SMTP server.");
//       }
//       throw error;
//     } else {
//       console.log('Email successfully sent!');
//     }
//   });
// });
