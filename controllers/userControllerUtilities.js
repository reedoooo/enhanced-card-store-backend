const mongoose = require('mongoose');
const winston = require('winston'); // Assuming winston is installed and configured
const User = require('../models/User'); // Adjust the path as necessary
const Collection = require('../models/Collection'); // Adjust the path as necessary
const { logger, logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const { validationResult } = require('express-validator');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, ERROR_SOURCES } = require('../constants');
const { validateCardInCollection } = require('./validateCollection');
const { validateXY } = require('./validateXY');
const { validateDataset } = require('./validateDataset');
const { validateCard } = require('./validateCard');
// const { validateCardBase } = require('./validateCardBase');
// const { validateCard } = require('./validateCard');
// const { validateCollection } = require('./validateCollection');
// const { validateUser } = require('./validateUser');

// exports.handleErrors = (res, error, next) => {
//   winston.error('Error:', error);
//   if (error instanceof mongoose.Error.ValidationError) {
//     return res
//       .status(STATUS.BAD_REQUEST)
//       .json({ message: MESSAGES.INVALID_DATA, error: error.errors });
//   }
//   if (error.code === 11000) {
//     return res
//       .status(STATUS.CONFLICT)
//       .json({ message: MESSAGES.DUPLICATE_KEY_ERROR, error: error.keyValue });
//   }
//   if (error instanceof CustomError) {
//     return res.status(error.statusCode).json({ message: error.message, details: error.details });
//   }
//   return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
// };

exports.handleNotFound = (resource, res) => {
  logger.infoLogger(`${resource} not found`);
  throw new CustomError(`${resource} ${MESSAGES.NOT_FOUND}`, STATUS.NOT_FOUND);
};
exports.validObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
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
// exports.logBodyDetails = (body) => {
//   // Log the details of the request body
//   try {
//     const fieldsToLog = [
//       'chartData',
//       'allCardPrices',
//       'userId',
//       '_id',
//       'name',
//       'description',
//       'totalCost',
//       'totalPrice',
//       'quantity',
//       'totalQuantity',
//       'xys',
//       'dailyPriceChange',
//     ];
//     fieldsToLog.forEach((field) => logger.info(`${field}: ${JSON.stringify(body[field])}`));

//     if (Array.isArray(body.cards) && body.cards.length > 0) {
//       const firstCard = body.cards[0];
//       logger.info('First Card:', firstCard);
//     }
//   } catch (error) {
//     throw new CustomError(`Failed to log body details: ${error.message}`, 500, true, { body });
//   }
// };

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

// Assuming that validateDataset, validateXY, validateCard, CustomError, STATUS,
// MESSAGES, ERROR_SOURCES, User, Collection, and other required entities are already defined elsewhere.
// let validationErrors = [];

// Assume validateDataset, validateXY, logToAllSpecializedLoggers, and other dependencies are defined elsewhere.

exports.handleIncomingDatasets = async (existingCollection, incomingDatasets) => {
  const validationErrors = [];

  for (const incomingDataset of incomingDatasets) {
    if (!validateDataset(existingCollection, incomingDataset)) {
      validationErrors.push({ message: 'Invalid Dataset', dataset: incomingDataset });
      continue;
    }

    let datasetToUpdate = existingCollection.chartData.datasets.find(
      (dataset) => dataset.name === incomingDataset.name,
    );

    if (datasetToUpdate) {
      datasetToUpdate.data = datasetToUpdate.data.map((dataItem, index) => ({
        ...dataItem,
        xys: [...dataItem.xys, ...incomingDataset.data[index].xys],
      }));
    } else {
      const newDataset = {
        name: incomingDataset.name,
        data: incomingDataset.data.map((dataItem) => ({
          xys: dataItem.xys.map((xy) => ({ label: xy.label, data: { x: xy.x, y: xy.y } })),
        })),
      };
      existingCollection.chartData.datasets.push(newDataset);
    }
  }

  try {
    await existingCollection.save();
    logToAllSpecializedLoggers(
      'info',
      'Successfully saved existingCollection',
      {
        section: 'info',
        data: existingCollection,
      },
      'log',
    );
  } catch (err) {
    logToAllSpecializedLoggers(
      'error',
      'Error occurred while saving existingCollection',
      {
        section: 'errors',
        error: err,
      },
      'log',
    );
    validationErrors.push({ message: 'Error saving collection', error: err });
  }

  return validationErrors;
};

exports.handleIncomingXY = async (existingCollection, incomingXYS) => {
  const validationErrors = [];
  existingCollection.xys = existingCollection.xys || [];

  for (const incomingXY of incomingXYS) {
    const xyEntry = {
      label: incomingXY.label,
      data: incomingXY.data.map((xy) => ({ x: xy.x, y: xy.y })),
    };

    if (!validateXY(xyEntry)) {
      validationErrors.push({ message: 'Invalid XY structure', xys: xyEntry });
      continue;
    }

    const existingXY = existingCollection.xys.find((xy) => xy.label === incomingXY.label);
    if (existingXY) {
      existingXY.data.push(...xyEntry.data);
    } else {
      existingCollection.xys.push(xyEntry);
    }
  }

  return validationErrors;
};

exports.processIncomingData = async (existingCollection, body) => {
  const processErrors = [];
  const { cards, chartData } = body;

  if (cards && !cards.every(validateCard)) {
    processErrors.push({ message: 'Invalid card structure', cards });
  }

  if (chartData?.datasets) {
    processErrors.push(
      ...(await this.handleIncomingDatasets(existingCollection, chartData.datasets)),
    );
  }

  if (chartData?.xys) {
    processErrors.push(...(await this.handleIncomingXY(existingCollection, chartData.xys)));
  }

  if (processErrors.length > 0) {
    return { errors: processErrors };
  }

  Object.assign(existingCollection, body, { xys: existingCollection.xys });

  return { updatedCollection: existingCollection };
};

exports.handleUpdateAndSync = async (params, body) => {
  try {
    const { userId, collectionId } = params;

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', STATUS.NOT_FOUND);
    }

    const existingCollection = await Collection.findOne({ _id: collectionId, userId });
    if (!existingCollection) {
      throw new CustomError('Collection not found', STATUS.NOT_FOUND);
    }

    // Ensure processIncomingData is awaited since it's potentially an asynchronous operation
    const processData = await this.processIncomingData(existingCollection, body);
    if (processData.errors && processData.errors.length) {
      // Handle the errors case

      // Log the errors
      processData.errors.forEach((error) => {
        logToAllSpecializedLoggers('error', error.message, { section: 'errors', error }, 'log');
      });
      logToAllSpecializedLoggers(
        'info',
        '[HANDLE UPDATE AND SYNC] --> Errors in processData',
        { section: 'info', data: existingCollection },
        'log',
      );
      return { errors: processData.errors };
    }

    await existingCollection.save();

    if (user.allCollections && !user.allCollections.includes(collectionId)) {
      user.allCollections.push(collectionId);
      await user.save();
    }

    // Successful update
    logToAllSpecializedLoggers(
      'info',
      'Update and sync successful',
      { section: 'info', data: existingCollection },
      'log',
    );

    return { updatedCollection: existingCollection };
  } catch (error) {
    // Log and re-throw the error for consistent error handling
    logToAllSpecializedLoggers('error', error.message, { section: 'errors', error }, 'log');
    throw error;
  }
};
