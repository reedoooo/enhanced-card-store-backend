const cron = require('node-cron');
const { cronJob } = require('./collection-cron');

let isCronJobRunning = false;
let cronJobRunCounter = 0;
const numberOfCronJobRuns = 5;

const cronTask = cron.schedule('*/10 * * * *', async () => {
  if (isCronJobRunning) return;

  isCronJobRunning = true;
  try {
    cronJobRunCounter++;
    await cronJob();

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      cronTask.stop();
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    isCronJobRunning = false;
  }
});

const startCronJob = async (req, res) => {
  cronTask.start();
  res.status(200).json({ message: 'Cron job started successfully.' });
};

const stopCronJob = async (req, res) => {
  cronTask.stop();
  cronJobRunCounter = 0; // Consider resetting the counter on stopping the task
  res.status(200).json({ message: 'Cron job stopped.' });
};

// Exporting functions if they are used in other files
module.exports = {
  startCronJob,
  stopCronJob,
};
