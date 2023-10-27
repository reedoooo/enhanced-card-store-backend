const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES } = require('../constants');
const { handleError } = require('../middleware/handleErrors');

const directedResponses = [];
let responseIndex = 0;

const directResponse = (res, eventType, options = {}) => {
  const { status = STATUS.SUCCESS, message = '', data = {}, error = null } = options;

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
};

const directError = (res, eventType, error, next) => {
  if (next && error) {
    return next(error);
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
};

const filterDirectedResponses = () => {
  const latestResponses = {};

  for (let i = directedResponses.length - 1; i >= 0; i--) {
    const response = directedResponses[i];
    if (!latestResponses[response.eventType]) {
      latestResponses[response.eventType] = response.index;
    }
  }

  const filteredResponses = directedResponses.filter(
    (response) => latestResponses[response.eventType] === response.index,
  );

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
  try {
    filterDirectedResponses(); // filter the responses before sending them
    res.status(STATUS.SUCCESS || 200).json(directedResponses);
  } catch (error) {
    next(error);
  }
};

module.exports = { directResponse, directError, getDirectedResponses };
