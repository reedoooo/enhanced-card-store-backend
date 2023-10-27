const mongoose = require('mongoose');
const winston = require('winston'); // Assuming winston is installed and configured
const User = require('../models/User'); // Adjust the path as necessary
const Collection = require('../models/Collection'); // Adjust the path as necessary
const { logger, cardPriceLogger } = require('../middleware/infoLogger');
const { validationResult } = require('express-validator');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES } = require('../constants');

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

exports.logBodyDetails = (body) => {
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

exports.handleValidationErrors = (req, res, next) => {
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
// exports.handleServerError = (error) => {
//   throw new CustomError(
//     `${MESSAGES.SERVER_ERROR}: ${error.message}`,
//     STATUS.INTERNAL_SERVER_ERROR,
//     true,
//     { error: error.message },
//   );
// };
exports.processIncomingData = async (existingCollection, body) => {
  try {
    const { cards, chartData, ...rest } = body;
    if (chartData?.datasets) {
      this.handleIncomingDatasets(existingCollection, chartData.datasets);
    }
    if (chartData?.xys) {
      this.handleIncomingXY(existingCollection, chartData.xys);
    }
    existingCollection.cards = this.filterUniqueCards(cards).map((card) => ({
      ...card,
      chart_datasets: this.handleDuplicateYValuesInDatasets(card),
    }));

    Object.assign(existingCollection, rest, {
      totalPrice: this.determineTotalPrice(
        rest.totalPrice,
        rest.totalCost,
        existingCollection.totalPrice,
      ),
    });

    return existingCollection;
  } catch (error) {
    throw new CustomError(`Failed to process incoming data: ${error.message}`, 500, true, {
      existingCollection,
      body,
    });
  }
};
exports.handleIncomingDatasets = (existingCollection, incomingDatasets) => {
  if (!existingCollection || !incomingDatasets) return;

  incomingDatasets.forEach((incomingDataset) => {
    const existingDataset = existingCollection.chartData.datasets.find(
      (dataset) => dataset.name === incomingDataset.name,
    );

    if (existingDataset) {
      // Merge existing data with incoming data
      existingDataset.data = [...existingDataset.data, ...incomingDataset.data];
      // Additional logic to merge or handle priceChangeDetails if necessary
    } else {
      // If the dataset does not exist, add it to the collection
      existingCollection.chartData.datasets.push(incomingDataset);
    }
  });
};
exports.handleIncomingXY = (existingCollection, incomingXYS) => {
  if (!existingCollection || !incomingXYS) {
    throw new CustomError('Existing collection or incoming XY data is missing', 400);
  }

  try {
    cardPriceLogger.info('[8][INCOMING XY] --> incomingXYs', incomingXYS);
    for (let incomingXY of incomingXYS) {
      if (
        !incomingXY.label ||
        typeof incomingXY.x === 'undefined' ||
        typeof incomingXY.y === 'undefined'
      ) {
        throw new CustomError('Missing label, x, or y in incoming XY data', 400);
      }

      const existingXY = existingCollection.chartData.xys.find(
        (xydata) => xydata.label === incomingXY.label,
      );

      if (existingXY) {
        console.log('[8][EXISTING XY] --> existingXY', existingXY);
        if (!Array.isArray(existingXY.data)) {
          existingXY.data = []; // Initialize as an array if it's not already
        }
        console.log(existingXY.data); // Add this line to debug

        existingXY.data.push({ x: incomingXY.x, y: incomingXY.y });
      } else {
        existingCollection.chartData.xys.push({
          label: incomingXY.label,
          data: [{ x: incomingXY.x, y: incomingXY.y }],
        });
      }

      existingCollection.chartData.allXYValues = this.filterData([
        ...existingCollection.chartData.allXYValues,
        { label: incomingXY.label, x: incomingXY.x, y: this.roundToTenth(incomingXY.y) },
      ]);
    }
  } catch (error) {
    throw new CustomError(`Failed to handle incoming XY data: ${error.message}`, 500, true, {
      incomingXYS,
    });
  }
};
exports.handleUpdateAndSync = async (userId, collectionId, body) => {
  try {
    this.logBodyDetails(body);

    const user = await User.findById(userId);
    if (!user) throw new CustomError('User not found', STATUS.NOT_FOUND);

    const existingCollection = await Collection.findOne({ _id: collectionId, userId }).populate(
      'chartData',
    );
    if (!existingCollection) throw new CustomError('Collection not found', STATUS.NOT_FOUND);

    const updatedCollection = await this.processIncomingData(existingCollection, body);
    await updatedCollection.save();

    return {
      success: true,
      data: { message: 'Collection and ChartData successfully updated', updatedCollection },
    };
  } catch (error) {
    throw new CustomError(
      `Failed to update and sync: ${error.message}`,
      STATUS.INTERNAL_SERVER_ERROR,
      true,
      {
        userId,
        collectionId,
        body,
      },
    );
  }
};
