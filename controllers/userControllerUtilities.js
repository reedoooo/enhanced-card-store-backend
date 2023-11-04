const mongoose = require('mongoose');
const winston = require('winston'); // Assuming winston is installed and configured
const User = require('../models/User'); // Adjust the path as necessary
const Collection = require('../models/Collection'); // Adjust the path as necessary
const { logger, cardPriceLogger, logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const { validationResult } = require('express-validator');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, ERROR_SOURCES } = require('../constants');
const { directError } = require('./userControllerResponses');
const validateDataset = require('./validateDataset');
const validateCard = require('./validateCard');
const validateXY = require('./validateXY');

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
exports.logBodyDetails = (body) => {
  // Log the details of the request body
  try {
    const fieldsToLog = [
      'chartData',
      'allCardPrices',
      'userId',
      '_id',
      'name',
      'description',
      'totalCost',
      'totalPrice',
      'quantity',
      'totalQuantity',
      'xys',
      'dailyPriceChange',
    ];
    fieldsToLog.forEach((field) => logger.info(`${field}: ${JSON.stringify(body[field])}`));

    if (Array.isArray(body.cards) && body.cards.length > 0) {
      const firstCard = body.cards[0];
      logger.info('First Card:', firstCard);
    }
  } catch (error) {
    throw new CustomError(`Failed to log body details: ${error.message}`, 500, true, { body });
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

// DIRECTLY RELATED TO USERCONTROLLER
exports.handleIncomingDatasets = (existingCollection, incomingDatasets) => {
  if (!existingCollection || !incomingDatasets) return;

  incomingDatasets.forEach((incomingDataset) => {
    // Assume validateDataset is a function that returns a boolean
    if (!validateDataset(incomingDataset)) {
      // Validate incoming dataset
      console.log('Invalid dataset structure', incomingDataset);
      throw new CustomError('Invalid dataset structure', 400);
    }

    const existingDataset = existingCollection.chartData.datasets.find(
      (dataset) => dataset.name === incomingDataset.name,
    );

    if (existingDataset) {
      existingDataset.data = [...existingDataset.data, ...incomingDataset.data];
    } else {
      existingCollection.chartData.datasets.push(incomingDataset);
    }
  });
};
exports.handleIncomingXY = (existingCollection, incomingXYS) => {
  if (!existingCollection || !incomingXYS) {
    throw new CustomError('Existing collection or incoming XY data is missing', 400);
  }

  incomingXYS.forEach((incomingXY) => {
    if (!validateXY(incomingXY)) {
      // Validate incoming XY
      throw new CustomError('Invalid XY structure', 400);
    }

    const existingXY = existingCollection.chartData.xys.find(
      (xydata) => xydata.label === incomingXY.label,
    );

    if (existingXY) {
      existingXY.data.push({ x: incomingXY.x, y: incomingXY.y });
    } else {
      existingCollection.chartData.xys.push({
        label: incomingXY.label,
        data: [{ x: incomingXY.x, y: incomingXY.y }],
      });
    }
  });
};
exports.processIncomingData = async (existingCollection, body) => {
  const { cards, chartData, ...rest } = body;
  if (chartData?.datasets) {
    this.handleIncomingDatasets(existingCollection, chartData.datasets);
  }
  if (chartData?.xys) {
    this.handleIncomingXY(existingCollection, chartData.xys);
  }

  if (cards && !cards.every(validateCard)) {
    throw new CustomError('Invalid card structure', 400);
  }

  existingCollection.cards = cards;

  Object.assign(existingCollection, rest);

  return existingCollection;
};

exports.handleUpdateAndSync = async (params, body) => {
  const { userId, collectionId } = params;

  try {
    const user = await User.findById(userId);
    if (!user) throw new CustomError('User not found', STATUS.NOT_FOUND);

    const existingCollection = await Collection.findOne({ _id: collectionId, userId });
    if (!existingCollection) throw new CustomError('Collection not found', STATUS.NOT_FOUND);

    const updatedCollection = await this.processIncomingData(existingCollection, body);
    await updatedCollection.save();

    if (user.allCollections && !user.allCollections.includes(collectionId)) {
      user.allCollections.push(collectionId);
      await user.save();
    }

    return {
      status: STATUS.SUCCESS,
      data: {
        message: 'Collection and ChartData successfully updated',
        updatedCollection,
        userId,
        collectionId,
      },
    };
  } catch (error) {
    logToAllSpecializedLoggers('Error in handleUpdateAndSync:', error);
    // throw new CustomError(
    //   `Failed to update and sync: ${error.message}`,
    //   STATUS.INTERNAL_SERVER_ERROR,
    //   true,
    //   {
    //     userId: params.userId,
    //     collectionId: params.collectionId,
    //     body,
    //   },
    // );
    return directError(
      // res,
      'HANDLE_UPDATE_AND_SYNC',
      error instanceof CustomError
        ? error
        : new CustomError(
            MESSAGES.UPDATE_AND_SYNC_COLLECTION_ERROR,
            STATUS.INTERNAL_SERVER_ERROR,
            true,
            {
              source: ERROR_SOURCES.HANDLE_UPDATE_AND_SYNC,
              detail: error.message || '',
              stack: error.stack,
            },
          ),
    );
  }
};
