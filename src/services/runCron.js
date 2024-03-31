const cron = require('node-cron');
const { updatedCollectionCron } = require('./updatedCollectionCron');
require('colors');

updatedCollectionCron();
// Run every 1 minutes
cron.schedule('1 * * * *', async () => {
  console.log('------------------------'.green);
  console.log('⏲️ RUNNING THE CRON');
  console.log('------------------------'.green);
  try {
    await updatedCollectionCron();
    console.log('Cron job completed successfully.');
  } catch (error) {
    console.error('Error occurred in cron job:', error);
  }
});
