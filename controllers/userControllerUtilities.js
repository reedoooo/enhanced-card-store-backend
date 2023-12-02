const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path as necessary
const Collection = require('../models/Collection'); // Adjust the path as necessary
const { logger, logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const { validationResult } = require('express-validator');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, GENERAL } = require('../constants');
const { validateDataset } = require('../middleware/validation/validateDataset');
const { validateXY } = require('../middleware/validation/validateXY');
const { logCollection } = require('../utils/collectionLogTracking');
const MonitoredCard = require('../models/MonitoredCard');
exports.handleNotFound = (resource, res) => {
  logger.infoLogger(`${resource} not found`);
  throw new CustomError(`${resource} ${MESSAGES.NOT_FOUND}`, STATUS.NOT_FOUND);
};
exports.validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
exports.handleValidationErrors = (req, res, next) => {
  // Handle validation errors which means that the request failed validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new CustomError(MESSAGES.VALIDATION_ERROR, STATUS.BAD_REQUEST, true, {
      validationErrors: errors.array(),
    });
    return next(error); // Pass the error to the next error-handling middleware
  }
  if (next) {
    next();
  }
};
exports.handleDuplicateYValuesInDatasets = (card) => {
  // Filter out duplicate y values in datasets
  if (card.chart_datasets && Array.isArray(card.chart_datasets)) {
    const yValuesSet = new Set(
      card.chart_datasets.map((dataset) => dataset.data && dataset.data[0]?.xy?.y),
    );
    return card.chart_datasets.filter((dataset) => {
      const yValue = dataset.data && dataset.data[0]?.xy?.y;
      if (yValuesSet.has(yValue)) {
        yValuesSet.delete(yValue);
        return true;
      }
      return false;
    });
  }
  return card.chart_datasets;
};
exports.filterUniqueCards = (cards) => {
  // Filter out duplicate cards
  const uniqueCardIds = new Set();
  return cards.filter((card) => {
    const cardId = typeof card.id === 'number' ? String(card.id) : card.id;
    if (!uniqueCardIds.has(cardId)) {
      uniqueCardIds.add(cardId);
      return true;
    }
    return false;
  });
};
exports.filterData = (data) => {
  // Filter out duplicate x values and y values
  const xValues = new Set();
  const yValues = new Set();
  return data.filter((item) => {
    if (xValues.has(item.x) || yValues.has(this.roundToTenth(item.y)) || item.y === 0) {
      return false;
    }
    xValues.add(item.x);
    yValues.add(this.roundToTenth(item.y));
    return true;
  });
};
exports.convertPrice = (price) => {
  // converts the price from string to number
  if (typeof price === 'string') {
    const convertedPrice = parseFloat(price);
    if (isNaN(convertedPrice)) throw new Error(`Invalid price value: ${price}`);
    return convertedPrice;
  }
  return price;
};
exports.determineTotalPrice = (totalPrice, totalCost, existingPrice) => {
  console.log('[8][DETERMINING UPDATED PRICE TO RETURN] --> totalPrice', totalPrice);
  console.log('[8][DETERMINING UPDATED PRICE TO RETURN] --> totalCost', totalCost);
  console.log('[8][DETERMINING UPDATED PRICE TO RETURN] --> existingPrice', existingPrice);

  if (totalPrice === 0 && totalCost) {
    return parseFloat(totalCost);
  } else {
    return totalPrice || existingPrice;
  }
};
exports.roundToTenth = (num) => {
  return Math.round(num * 10) / 10;
};
exports.ensureCollectionExists = async (userId) => {
  try {
    const collection = await Collection.findOne({ userId });
    if (!collection) {
      const newCollection = new Collection({ userId });
      await newCollection.save();
      return newCollection;
    }
    return collection;
  } catch (error) {
    throw new CustomError(
      `${MESSAGES.FAILED_TO_ENSURE_COLLECTION_EXISTS}: ${error.message}`,
      STATUS.INTERNAL_SERVER_ERROR,
      true,
      {
        userId,
      },
    );
  }
};
const updateOrCreateDataset = (existingCollection, incomingDataset) => {
  let datasetToUpdate = existingCollection.chartData.datasets.find(
    (dataset) => dataset.name === incomingDataset.name,
  );

  if (datasetToUpdate) {
    datasetToUpdate.data = datasetToUpdate.data.map((dataItem, index) => {
      // Merge the xys data for the datasets
      let updatedXYS = [...dataItem.xys, ...incomingDataset.data[index].xys];

      // Update the corresponding entry in collection.xys
      let collectionXYS = existingCollection.xys.find((xy) => xy.label === incomingDataset.name);
      if (collectionXYS) {
        collectionXYS.data = updatedXYS.map((xy) => ({ x: xy.x, y: xy.y }));
      } else {
        existingCollection.xys.push({
          label: incomingDataset.name,
          data: updatedXYS.map((xy) => ({ x: xy.x, y: xy.y })),
        });
      }

      // Update the corresponding entry in chartData.xys
      let chartXYS = existingCollection.chartData.xys.find(
        (xy) => xy.label === incomingDataset.name,
      );
      if (chartXYS) {
        chartXYS.data = updatedXYS.map((xy) => ({ x: xy.x, y: xy.y }));
      } else {
        existingCollection.chartData.xys.push({
          label: incomingDataset.name,
          data: updatedXYS.map((xy) => ({ x: xy.x, y: xy.y })),
        });
      }

      // Update allXYValues
      existingCollection.chartData.allXYValues.push(
        ...updatedXYS.map((xy) => ({ label: incomingDataset.name, x: xy.x, y: xy.y })),
      );

      return {
        ...dataItem,
        xys: updatedXYS,
      };
    });
  } else {
    // If dataset does not exist, create new one and update corresponding xys in collection and chartData
    const newDatasetData = incomingDataset.data.map((dataItem) => ({
      xys: dataItem.xys.map((xy) => ({ label: xy.label, data: { x: xy.x, y: xy.y } })),
    }));

    const newDataset = {
      name: incomingDataset.name,
      data: newDatasetData,
    };

    existingCollection.chartData.datasets.push(newDataset);

    // Create a new xys entry in the collection and chartData for the new dataset
    existingCollection.xys.push({
      label: incomingDataset.name,
      data: newDatasetData.flatMap((dataItem) => dataItem.xys.map((xy) => xy.data)),
    });

    existingCollection.chartData.xys.push({
      label: incomingDataset.name,
      data: newDatasetData.flatMap((dataItem) => dataItem.xys.map((xy) => xy.data)),
    });

    // Add new xys to allXYValues
    existingCollection.chartData.allXYValues.push(
      ...newDatasetData.flatMap((dataItem) =>
        dataItem.xys.map((xy) => ({ label: incomingDataset.name, x: xy.data.x, y: xy.data.y })),
      ),
    );
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const logError = (message, error) => {
  logToAllSpecializedLoggers('error', message, { section: 'errors', error }, 'log');
  if (error.data) {
    logToAllSpecializedLoggers('info', message, { section: 'errors', data: error.data }, 'log');
  }
};
const logInfo = (message, data) => {
  logToAllSpecializedLoggers('info', message, { section: 'info', data: data }, 'log');
};

exports.handleIncomingDatasets = async (existingCollection, incomingDatasets) => {
  const validationErrors = [];

  for (const incomingDataset of incomingDatasets) {
    try {
      if (validateDataset(existingCollection, incomingDataset)) {
        updateOrCreateDataset(existingCollection, incomingDataset);
      } else {
        validationErrors.push({ message: 'Invalid Dataset', data: incomingDataset });
      }
    } catch (error) {
      validationErrors.push({
        message: 'Database operation failed',
        data: incomingDataset,
        error: error.message,
      });
    }
  }

  return validationErrors;
};

exports.handleIncomingXY = async (existingCollection, incomingXYS) => {
  const validationErrors = [];
  existingCollection.xys = existingCollection.xys || [];

  // console.log('[1][EXISTING COLLECTION XYS] -->', existingCollection.xys);
  // console.log('[1][EXISTING COLLECTION CHARTDATA XYS] -->', existingCollection.chartData.xys);
  // console.log(
  //   '[1][EXISTING COLLECTION CHARTDATA ALLXYVALUES] -->',
  //   existingCollection.chartData.allXYValues,
  // );
  // console.log(
  //   '[1][EXISTING COLLECTION CHARTDATA DATASETS] -->',
  //   existingCollection.chartData.datasets,
  // );
  // console.log(
  //   '[1][EXISTING COLLECTION CHARTDATA DATASETS DATA] -->',
  //   existingCollection.chartData.datasets[0].data,
  // );
  // console.log(
  //   '[1][EXISTING COLLECTION CHARTDATA DATASETS DATA XYS] -->',
  //   existingCollection.chartData.datasets[0].data[0].xys,
  // );
  // console.log(
  //   '[1][EXISTING COLLECTION CHARTDATA DATASETS DATA XYS DATA] -->',
  //   existingCollection.chartData.datasets[0].data[0].xys[0].data,
  // );
  // console.log('INCOMING XYZ', incomingXYS);
  for (const incomingXY of incomingXYS) {
    // console.log('INCOMING XY', incomingXY);
    const xyEntry = {
      label: incomingXY.label,
      data: incomingXY.data,
    };

    if (!validateXY(xyEntry)) {
      validationErrors.push({ message: 'Invalid XY structure', data: xyEntry });
      continue;
    }

    // Update the corresponding entry in collection.xys
    // let collectionXYS = existingCollection.xys.find((xy) => xy.label === incomingXY.label);
    // if (collectionXYS) {
    //   collectionXYS.data.push(xyEntry.data);
    // } else {
    //   existingCollection.xys.push({
    //     label: incomingXY.label,
    //     data: [xyEntry.data],
    //   });
    // }

    // Update the corresponding entry in chartData.xys
    let chartXYS = existingCollection.chartData.xys.find((xy) => xy.label === incomingXY.label);
    if (chartXYS) {
      // console.log('CHART XYS FOUND', chartXYS);
      // chartXYS.data.push(xyEntry.data);
    } else {
      existingCollection.chartData.xys.push({
        label: incomingXY.label,
        data: [xyEntry.data],
      });
    }

    // Add new xys to allXYValues
    existingCollection.chartData.allXYValues.push({
      label: incomingXY.label,
      x: xyEntry.data.x,
      y: xyEntry.data.y,
    });
  }

  // Uncomment the following line if you want to save the changes to the database
  await existingCollection.save();

  return validationErrors;
};

exports.processIncomingData = async (existingCollection, chartData) => {
  const processErrors = [];

  // Process datasets and XYs asynchronously
  const datasetErrors = chartData?.datasets
    ? await this.handleIncomingDatasets(existingCollection, chartData.datasets)
    : [];
  // Assuming chartData.datasets is an array of datasets
  const xyErrors = chartData?.datasets
    ? await this.handleIncomingXY(
        existingCollection,
        chartData.datasets.flatMap((dataset) =>
          dataset.data.flatMap(
            (dataItem) => dataItem.xys,
            // dataItem.xys.map((xy) => ({
            //   label: dataset.name,
            //   data: xy.data,
            // })),
          ),
        ),
      )
    : [];

  // Accumulate all errors
  processErrors.push(...datasetErrors, ...xyErrors);

  // Log and return errors if present
  if (processErrors.length) {
    processErrors.forEach((error) => logError(error.message, error));
    return { errors: processErrors };
  }

  // Update chart data in the collection
  existingCollection.chartData = { ...existingCollection.chartData, ...chartData };

  let attempt = 0;
  while (attempt < GENERAL.MAX_RETRIES) {
    try {
      await existingCollection.save();
      return { status: 'success', data: existingCollection };
    } catch (error) {
      if (error.name === 'VersionError' && attempt < GENERAL.MAX_RETRIES - 1) {
        await delay(1000);
        attempt++;
      } else {
        return {
          status: 'error',
          message: 'Failed to update collection.',
          errorDetails: error.message,
        };
      }
    }
  }
  throw new Error('Update attempts exceeded');
};

exports.handleCardUpdate = async ({ userId, collectionId }, cardsToUpdate) => {
  try {
    const collection = await Collection.findOne({ _id: collectionId, userId });
    if (!collection) {
      throw new Error('Collection not found');
    }

    const user = await User.findById(userId).populate('allCollections');

    for (const cardUpdate of cardsToUpdate) {
      let monitoredCard = await MonitoredCard.findOne({ id: cardUpdate.id });

      if (monitoredCard) {
        monitoredCard.quantity = cardUpdate.quantity;
        monitoredCard.latestPrice = {
          num: cardUpdate?.latestPrice?.num || 0,
          timestamp: cardUpdate?.latestPrice?.timestamp || new Date(),
        };
        monitoredCard.lastSavedPrice = {
          num: cardUpdate?.lastSavedPrice?.num || 0,
          timestamp: cardUpdate?.lastSavedPrice?.timestamp || new Date(),
        };
        monitoredCard.tag = 'monitored';
        monitoredCard.name = cardUpdate.name;
        monitoredCard.id = cardUpdate.id;
        monitoredCard.collectionId = collection._id;
        // monitoredCard.priceHistory.push({ num: cardUpdate.latestPrice, timestamp: new Date() });
        await monitoredCard.save();
      } else {
        monitoredCard = new MonitoredCard({
          id: cardUpdate.id,
          name: cardUpdate.name,
          collectionId: collection._id,
          tag: 'monitored',
          latestPrice: {
            num: isNaN(parseFloat(cardUpdate?.latestPrice?.num))
              ? 0
              : parseFloat(cardUpdate?.latestPrice?.num),
            timestamp: new Date(),
          },
          lastSavedPrice: {
            num: isNaN(parseFloat(cardUpdate?.lastSavedPrice?.num))
              ? 0
              : parseFloat(cardUpdate?.lastSavedPrice?.num),
            timestamp: new Date(),
          },
          // priceHistory: [{ num: cardUpdate.latestPrice.num, timestamp: new Date() }],
          quantity: cardUpdate.quantity,
        });
        await monitoredCard.save();
      }

      const cardIndex = collection.cards.findIndex((card) => card.id === cardUpdate.id);
      if (cardIndex !== -1) {
        const parsedLatestPrice = parseFloat(cardUpdate.latestPrice) || 0;
        const parsedQuantity = parseInt(cardUpdate.quantity) || 0;
        // const totalCardPrice = parsedLatestPrice * parsedQuantity;

        collection.cards[cardIndex] = {
          ...collection.cards[cardIndex],
          name: cardUpdate.name,
          id: cardUpdate.id,
          price: isNaN(parseFloat(cardUpdate?.latestPrice?.num))
            ? collection.cards[cardIndex].price
            : parseFloat(cardUpdate?.latestPrice?.num),
          totalPrice: isNaN(parseFloat(cardUpdate?.latestPrice?.num * cardUpdate.quantity))
            ? collection.cards[cardIndex].totalPrice
            : parseFloat(cardUpdate?.latestPrice?.num * cardUpdate.quantity),
          quantity: parsedQuantity,
          latestPrice: {
            num: parsedLatestPrice || 0,
            timestamp: cardUpdate?.latestPrice?.timestamp || new Date(),
          },
          lastSavedPrice: {
            num: cardUpdate?.lastSavedPrice?.num || 0,
            timestamp: cardUpdate?.lastSavedPrice?.timestamp || new Date(),
          },
          priceHistory: [
            ...collection.cards[cardIndex].priceHistory,
            { num: cardUpdate?.latestPrice?.num, timestamp: new Date() } || {
              num: 0,
              timestamp: new Date(),
            },
          ],

          dailyPriceHistory: [
            ...collection.cards[cardIndex].dailyPriceHistory,
            { num: cardUpdate?.latestPrice?.num, timestamp: new Date() } || {
              num: 0,
              timestamp: new Date(),
            },
          ],
          tag: 'monitored',
          chart_datasets: this.handleDuplicateYValuesInDatasets({
            ...collection.cards[cardIndex],
            chart_datasets: cardUpdate.chart_datasets,
          }),
          card_images: cardUpdate.card_images,
          image: cardUpdate.image,
          card_prices: cardUpdate.card_prices,
          archetype: cardUpdate.archetype,
          atk: cardUpdate.atk,
          attribute: cardUpdate.attribute,
          def: cardUpdate.def,
          description: cardUpdate.description,
          frameType: cardUpdate.frameType,
        };
      }
    }

    // await collection.save();

    // Update the user's allCollections with the updated collection
    const updatedCollectionIndex = user.allCollections.findIndex(
      (collection) => collection._id.toString() === collectionId,
    );

    if (updatedCollectionIndex !== -1) {
      user.allCollections[updatedCollectionIndex] = collection;
      await user.save();
    }

    return { status: 'success', data: collection };
  } catch (error) {
    console.error('Error updating cards in collection:', error);
    return { status: 'error', message: 'Failed to update cards', errorDetails: error };
  }
};

exports.handleChartDataUpdate = async (userId, collectionId, chartData) => {
  try {
    const existingCollection = await Collection.findOne({ _id: collectionId, userId });

    if (!existingCollection) {
      return { status: 'error', message: 'Collection not found or access denied.' };
    }

    const processedData = await this.processIncomingData(existingCollection, chartData);

    logInfo('Processed incoming data', { processedData });
    if (processedData.errors) {
      logError('Failed to process incoming data', { errors: processedData.errors });
      return {
        status: 'error',
        message: 'Failed to process incoming data',
        error: processedData.errors,
      };
    }

    const updatedCollection = await existingCollection.save();
    return { status: 'success', data: updatedCollection };
  } catch (error) {
    console.error('Error updating chart data:', error);
    return { status: 'error', message: 'Failed to update chart data.', errorDetails: error };
  }
};

exports.updateCollectionFields = (collection, updateFields) => {
  const fieldsToUpdate = [
    'name',
    'description',
    'totalCost',
    'totalPrice',
    'quantity',
    'totalQuantity',
    'dailyPriceChange',
    'dailyPercentChange',
    'updatedAt',
    'xys',
    'collectionPriceHistory',
    'priceDifference',
    'priceChange',
    'previousDayTotalPrice',
    'allCardPrices',
    'currentChartDataSets',
    'currentChartDataSets2',
  ];

  fieldsToUpdate.forEach((field) => {
    if (field in updateFields) {
      collection[field] = updateFields[field];
    }
  });

  // Deep merge chartData if it exists in updateFields
  if ('chartData' in updateFields) {
    collection.chartData = {
      ...collection.chartData,
      ...updateFields.chartData,
      datasets: [
        ...(collection.chartData.datasets || []),
        ...(updateFields.chartData.datasets || []),
      ],
      xys: [...(collection.chartData.xys || []), ...(updateFields.chartData.xys || [])],
    };
  }

  if ('cards' in updateFields) {
    collection.cards = updateFields.cards;
  }

  return collection;
};

exports.handleUpdateAndSync = async (params, body) => {
  let attempt = 0;
  while (attempt < GENERAL.MAX_RETRIES) {
    try {
      const { userId, collectionId } = params;
      logger.debug(`Handling update and sync for userId: ${userId}, collectionId: ${collectionId}`);

      const user = await User.findById(userId).populate('allCollections');
      if (!user) {
        logger.error('User not found', { userId });
        throw new Error('User not found');
      }

      const existingCollection = user.allCollections.find(
        (collection) => collection._id.toString() === collectionId,
      );

      if (!existingCollection || !isValidObjectId(collectionId)) {
        logError('Collection not found or invalid ID', { data: { userId, collectionId } });
        throw new Error('Collection not found or invalid ID');
      }

      const updatedCollection = this.updateCollectionFields(existingCollection, body);

      // Save the updated collection
      await updatedCollection.save();
      logInfo('UPDATE AND SYNC SUCCESSFUL', {
        data: updatedCollection.toObject(),
      });
      logCollection(updatedCollection);

      // Update the user's allCollections with the updated collection
      const updatedCollectionIndex = user.allCollections.findIndex(
        (collection) => collection._id.toString() === collectionId,
      );

      if (updatedCollectionIndex !== -1) {
        user.allCollections[updatedCollectionIndex] = updatedCollection;
        await user.save();
      }

      return { status: 'success', data: updatedCollection.toObject() };
    } catch (error) {
      attempt++;
      // logData('error', 'Attempt to update and sync collection failed', {
      //   error: error.toString(),
      //   stack: error.stack,
      //   attempt,
      //   userId: params.userId,
      //   collectionId: params.collectionId,
      //   updateData: body,
      // });
      logError('Attempt to update and sync collection failed', {
        error: {
          message: error.message,
          stack: error.stack,
          operationData: {
            // Include any relevant data that could help in debugging
            userId: params.userId,
            collectionId: params.collectionId,
            body: body,
            attempt: attempt,
          },
        },
        stack: error.stack,
        attempt,
        userId: params.userId,
        collectionId: params.collectionId,
        updateData: body,
      });
      if (!(error.name === 'VersionError' && attempt < GENERAL.MAX_RETRIES)) {
        // Log the error with detailed information
        return {
          status: 'error',
          message: 'Failed to update and sync collection.',
          errorDetails: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            operationData: params,
            attempt: attempt,
            body: body,
          },
        };
      }
    }
  }
  logCollection('error', 'MAX ATTEMPTS EXCEEDED', {
    userId: params.userId,
    collectionId: params.collectionId,
  });
  logError('MAX ATTEMPTS EXCEEDED', {
    userId: params.userId,
    collectionId: params.collectionId,
  });
  // logger.error('Maximum attempts to update and sync collection exceeded', {
  //   userId: params.userId,
  //   collectionId: params.collectionId,
  // });
  throw new Error('Update and sync attempts exceeded');
};
