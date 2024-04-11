const cron = require('node-cron');
const { updatedCollectionCron } = require('./updatedCollectionCron');
const logger = require('../configs/winston');
require('colors');

updatedCollectionCron();
// Run every 1 minutes
cron.schedule('1 * * * *', async () => {
  logger.info('------------------------'.green);
  logger.info('⏲️ RUNNING THE CRON');
  logger.info('------------------------'.green);
  try {
    await updatedCollectionCron();
    logger.info('Cron job completed successfully.');
  } catch (error) {
    logger.error('Error occurred in cron job:', error);
  }
});
