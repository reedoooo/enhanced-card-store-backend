const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES } = require('../constants');
const { handleError } = require('../middleware/handleErrors');

const directedResponses = [];
let responseIndex = 0;
let isResponseSent = false;

const directResponse = (res, eventType, options = {}) => {
  const { status = STATUS.SUCCESS, message = '', data = {}, error = null } = options;
  if (isResponseSent) {
    console.warn('Attempted to send multiple responses');
    return;
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('Direct Response Called', eventType, options);
  }

  const responseMessage = message || getDefaultMessage(status);

  const response = {
    status: status,
    message: responseMessage,
    data,
    error,
  };

  logResponse(eventType, response, responseIndex);
  directedResponses.push({
    index: responseIndex,
    eventType,
    timestamp: new Date(),
    response,
  });

  responseIndex += 1;

  const httpStatus = typeof status === 'number' ? status : 500;
  res.status(httpStatus).json(response);
  isResponseSent = true;
};

const directError = (res, eventType, error, next) => {
  if (next && error) {
    return next(error);
  }
  if (isResponseSent) {
    console.warn('Attempted to send multiple responses');
    return;
  }
  if (!(error instanceof CustomError)) {
    error = new CustomError(
      error?.message ?? MESSAGES.AN_ERROR_OCCURRED,
      error?.status ?? STATUS.INTERNAL_SERVER_ERROR,
      true,
      {
        errorType: eventType,
        source: error?.source ?? 'Unknown',
        detail: error?.detail ?? null,
        stack: error?.stack ?? null,
      },
    );
  }

  console.error('Error:', error);

  const { status, message: errorMessage } = handleError(error, error.context);
  directResponse(res, eventType, {
    status: status ?? STATUS.ERROR,
    message: errorMessage ?? MESSAGES.AN_ERROR_OCCURRED,
    error: {
      detail: error.detail,
      source: error.source,
      errorStack: error.stack,
    },
  });
  isResponseSent = true;
};

const filterDirectedResponses = () => {
  const latestResponses = new Map(); // For unique eventType
  const latestResponsesWithData = new Map(); // For unique eventType and data

  // Filter and identify latest responses
  directedResponses.forEach((response, index) => {
    const eventType = response.eventType;
    const dataStr = JSON.stringify(response.response.data); // Converting data to string for comparison

    if (!latestResponses.has(eventType) || latestResponses.get(eventType).index < index) {
      latestResponses.set(eventType, { index });
    }

    // Use eventType and dataStr as key
    const compositeKey = `${eventType}_${dataStr}`;
    if (
      !latestResponsesWithData.has(compositeKey) ||
      latestResponsesWithData.get(compositeKey).index < index
    ) {
      latestResponsesWithData.set(compositeKey, { index });
    }
  });

  // Remove duplicates based on eventType and data
  const filteredResponses = directedResponses.filter((response) => {
    const eventType = response.eventType;
    const dataStr = JSON.stringify(response.response.data);
    const compositeKey = `${eventType}_${dataStr}`;

    return (
      latestResponses.get(eventType).index === response.index &&
      latestResponsesWithData.get(compositeKey).index === response.index
    );
  });

  // Clear and repopulate directedResponses
  directedResponses.length = 0;
  directedResponses.push(...filteredResponses);
};

const getDefaultMessage = (status) => {
  switch (status) {
    case STATUS.ERROR:
      return MESSAGES.AN_ERROR_OCCURRED;
    case STATUS.SUCCESS:
      return MESSAGES.SUCCESS;
    default:
      return '';
  }
};

const logResponse = (eventType, response, index) => {
  console.log(`RESPONSE INDEX: ${index}`);
  console.log(`EVENT TYPE: ${eventType}`);
  console.log('RESPONSE:', response);
  console.log('DIRECTED RESPONSES:', directedResponses);
};

const getDirectedResponses = async (req, res, next) => {
  console.log('DIRECTED RESPONSES:', directedResponses);
  console.log('REQ:', req);
  try {
    console.log('Attempting to get and send directed responses');
    filterDirectedResponses();
    res.status(STATUS.SUCCESS || 200).json(directedResponses);
  } catch (error) {
    console.error(`An error occurred while getting directed responses: ${error.message}`);
    next(error);
  }
};

module.exports = { directResponse, directError, getDirectedResponses };
