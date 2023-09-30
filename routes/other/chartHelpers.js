const axios = require('axios');
const socket = require('../../socket');
const ChartData = require('../../models/ChartData');

const addNewDataSet = async (req, res) => {
  try {
    const { dataSetName, dataSetValues } = req.body;
    const newChartData = new ChartData({
      name: dataSetName,
      values: dataSetValues,
    });

    await newChartData.save();

    const io = socket.getIO();
    io.emit('newDataSetAdded', { data: newChartData });

    res.status(201).json({ message: 'New data set added successfully.', data: newChartData });
  } catch (error) {
    console.error('Error adding new data set: ', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  addNewDataSet,
};
