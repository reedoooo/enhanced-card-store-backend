const cron = require('node-cron');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const User = require('../../models/User');
const { getIO } = require('../../socket');
const { updateCardsInItem } = require('./cardManager');
const { updateCollections } = require('./collectionManager');
const { ChartData } = require('../../models/ChartData');

// Constants
const NUMBER_OF_CRONJOB_RUNS = 5;

// Refactored utility functions
const processItem = async (item) => {
  if (!item || typeof item.save !== 'function') {
    console.error('Item is not defined or not a Mongoose model instance');
    return 0;
  }

  const itemTypeData = await updateCardsInItem(item, item.userId); // Assuming the item has a userId field.
  console.log('itemTypeData:', itemTypeData);
  await cleanProcessedData(itemTypeData);

  await item.save(itemTypeData);
  // Delete all documents with a priceChange of 0

  return itemTypeData.totalPrice || 0;
};

const cleanProcessedData = async (item) => {
  ChartData.deleteMany({ priceChange: 0 })
    .then((result) => {
      console.log(
        'Data points with priceChange of 0 were successfully deleted:',
        result.deletedCount,
      );
    })
    .catch((err) => {
      console.error('Error deleting data points:', err);
    });
};

// Main Functions
const cronJob = async (userId) => {
  const io = getIO();

  if (!userId) throw new Error('UserId is missing or invalid at cronJob');

  // Local state variables
  let totalCollectionPrice = 0;
  let totalDeckPrice = 0;
  let cronJobRunCounter = 0;
  let isCronJobRunning = false;

  const task = cron.schedule('*/5 * * * *', async () => {
    if (isCronJobRunning) return;

    isCronJobRunning = true;
    cronJobRunCounter++;

    try {
      const users = await User.find();
      for (const user of users) {
        await updateCollections(user);
      }

      // Resetting data
      totalCollectionPrice = 0;
      totalDeckPrice = 0;

      const collections = await Collection.find().populate('cards');
      const decks = await Deck.find().populate('cards');

      for (const collection of collections) {
        totalCollectionPrice += await processItem(collection);
      }
      for (const deck of decks) {
        totalDeckPrice += await processItem(deck);
      }

      io.emit('ALL_DATA_ITEMS', {
        cronJobRunCounter,
        totalCollectionPrice,
        totalDeckPrice,
      });

      if (cronJobRunCounter >= NUMBER_OF_CRONJOB_RUNS) {
        task.stop();
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      isCronJobRunning = false;
    }
  });

  task.start();
};

const stopCron = (task) => {
  if (task) task.stop();
};

module.exports = {
  cronJob,
  stopCron,
};
