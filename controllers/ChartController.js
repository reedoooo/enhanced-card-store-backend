const ChartData = require('../models/ChartData');
const User = require('../models/User');

exports.getAllData = async (req, res) => {
  try {
    const data = await ChartData.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllChartDataForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = await ChartData.find({ userId });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateChartData = async (req, res) => {
  try {
    const collectionId = req.params.collectionId;
    const updatedData = await ChartData.findByIdAndUpdate(collectionId, req.body, {
      new: true,
    });
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addNewDataSet = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data } = req.body;
    console.log('DATA RECEIVED:', data);

    // Check for identical data
    const existingData = await ChartData.findOne({ userId, data });
    if (existingData) {
      return res.status(409).json({ error: 'Identical data already exists' });
    }

    const newData = new ChartData({ userId, data });
    console.log('NEW DATA:', newData);
    await newData.save();

    // Assuming user has an allDataSets field to store all datasets
    user.allDataSets.push(newData._id);
    await user.save();

    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDataItem = async (req, res) => {
  try {
    const { userId, collectionId } = req.params;
    const deletedData = await ChartData.findOneAndDelete({ _id: collectionId, userId });
    res.status(200).json(deletedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDataItem = async (req, res) => {
  try {
    // Implement the logic to update a specific data item
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
