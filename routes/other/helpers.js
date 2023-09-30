// Desc: Helper functions for other routes
const User = require('../../models/User');

// Example Axios instance to fetch data

// async function runCronJobAndPause() {
//   await cronJob();
//   await new Promise((resolve) => setTimeout(resolve, 2000));
// }
const runCronJobAndPause = async (cronJob) => {
  await cronJob();
  await new Promise((resolve) => setTimeout(resolve, 2000));
};

const commonLogic = async (req, res, userId) => {
  try {
    await runCronJobAndPause();

    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let { allCollectionData, allDeckData } = req.body;

    allCollectionData = allCollectionData.filter(
      (collection, index, self) => index === self.findIndex((c) => c.id === collection.id),
    );
    allDeckData = allDeckData.filter(
      (deck, index, self) => index === self.findIndex((d) => d.id === deck.id),
    );

    const totalDeckPrice = allDeckData.reduce((acc, item) => acc + item.totalPrice, 0);
    const totalCollectionPrice = allCollectionData.reduce((acc, item) => acc + item.totalPrice, 0);

    return {
      totalDeckPrice,
      totalCollectionPrice,
      allCollectionData,
      allDeckData,
      user,
    };
  } catch (error) {
    console.error(error);
    if (res) res.status(500).json({ error: error.message });
  }
};

module.exports = {
  runCronJobAndPause,
  commonLogic,
};
