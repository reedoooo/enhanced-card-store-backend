require('colors');
const path = require('path');

const STATUS = {
  SUCCESS: 200 || 'success' || 'ok',
  ERROR: 500 || 'error' || 'fail',
  INTERNAL_SERVER_ERROR: 500 || 'internal server error',
  UNAUTHORIZED: 401 || 'unauthorized' || 'unauthenticated',
  FORBIDDEN: 403 || 'forbidden',
  BAD_REQUEST: 400 || 'bad request',
  NOT_FOUND: 404 || 'not found',
  CONFLICT: 409 || 'conflict',
  DUPLICATE_KEY_ERROR: 11000 || 'duplicate key error',
};

// Constants for messages of a response
const MESSAGES = {
  // General messages
  SUCCESS: 'Success',
  ERROR: 'Error',
  INVALID_USER_DATA: 'Invalid user data',
  DUPLICATE_KEY_ERROR: 'Duplicate key error',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  REQUIRED_FIELDS_MISSING: 'Required fields missing',
  // CLIENT_MESSAGE_RECEIVED: 'Client message received',
  // AN_ERROR_OCCURRED: 'An error has occurred',

  // Utility and Helper Functions messages
  NOT_FOUND: (resource) => `${resource} not found`,
  FAILED_TO_ENSURE_COLLECTION_EXISTS: 'Failed to ensure collection exists',
  COLLECTION_CHART_DATA_UPDATED: 'Collection and ChartData successfully updated',
  VALIDATION_ERROR: 'Validation Error',
  SERVER_ERROR: (error) => `Server error: ${error.message}`,

  // Socket messages
  CLIENT_MESSAGE_RECEIVED: 'Hello to you too, client!',
  CRON_JOB_STOPPED: 'Cron job has been stopped.',
  INVALID_DATA: 'Invalid data received',
  NO_PRICE_CHANGES: 'No card prices have changed.',
  CARD_PRICES_CHECKED: 'Card prices have been checked.',
  USER_DATA_UPDATED: 'User data has been updated.',
  USER_COLLECTION_UPDATED: 'User collection has been updated.',
  COLLECTION_SYNCED: 'Collection has been synced',
  AN_ERROR_OCCURRED: 'An error occurred',

  // Controller messages
  SIGNIN_SUCCESS: 'Signin successful',
  SIGNUP_SUCCESS: 'Signup successful',
  // Controllers
  SIGNIN_ERROR: 'SIGNIN_ERROR',
  SIGNUP_ERROR: 'SIGNUP_ERROR',
  GET_PROFILE_SUCCESS: 'Get profile successful',
  UPDATE_PROFILE_SUCCESS: 'Update profile successful',
  DELETE_PROFILE_SUCCESS: 'Delete profile successful',
  GET_USER_BY_ID_SUCCESS: 'Get user by id successful',
  GET_ALL_DECKS_FOR_USER_SUCCESS: 'Get all decks for user successful',
  UPDATE_AND_SYNC_DECK_SUCCESS: 'Update and sync deck successful',
  CREATE_NEW_DECK_SUCCESS: 'Create new deck successful',
  CREATE_NEW_COLLECTION_SUCCESS: 'New collection created successfully',
  GET_ALL_COLLECTIONS_FOR_USER_SUCCESS: 'Get all collections for user successful',
  UPDATE_AND_SYNC_COLLECTION_SUCCESS: 'Update and sync collection successful',
  UPDATE_AND_SYNC_COLLECTION_ERROR: 'UPDATE_AND_SYNC_COLLECTION_ERROR',
  DELETE_COLLECTION_SUCCESS: 'Delete collection successful',

  // Controller messages II
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_NOT_AUTHORIZED: 'User not authorized',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  USER_NOT_FOUND_BY_ID: 'User not found by id',
  INVALID_USERNAME: 'Invalid username',
  INVALID_PASSWORD: 'Invalid password',
};

// Constants for error sources
const ERROR_SOURCES = {
  // Utility Functions
  HANDLE_ERRORS: 'handleErrors',
  ENSURE_COLLECTION_EXISTS: 'ensureCollectionExists',
  HANDLE_UPDATE_AND_SYNC: 'handleUpdateAndSync',
  LOG_BODY_DETAILS: 'logBodyDetails',
  PROCESS_INCOMING_DATA: 'processIncomingData',
  HANDLE_VALIDATION_ERRORS: 'handleValidationErrors',
  HANDLE_SERVER_ERROR: 'handleServerError',
  HANDLE_INCOMING_DATASETS: 'handleIncomingDatasets',
  HANDLE_INCOMING_XY: 'handleIncomingXY',
  CONVERT_PRICE: 'convertPrice',
  FILTER_UNIQUE_CARDS: 'handleDuplicateYValuesInDatasets',
  FILTER_DATA: 'filterData',
  DETERMINE_TOTAL_PRICE: 'determineTotalPrice',
  ROUND_TO_TENTH: 'roundToTenth',

  // Sockets
  HANDLE_MESSAGE_FROM_CLIENT: 'handleMessageFromClient',
  HANDLE_STOP_CRON_JOB: 'handleStopCronJob',
  HANDLE_CLIENT_REQUEST_FOR_PRICE_CHECK: 'handleClientRequestForPriceCheck',
  HANDLE_SCHEDULE_CHECK_CARD_PRICES: 'handleScheduleCheckCardPrices',
  HANDLE_CHECK_CARD_PRICES: 'handleCheckCardPrices',
  HANDLE_UPDATE_USER_DATA: 'handleUpdateUserData',
  HANDLE_UPDATE_USER_COLLECTIONS_SOCKET: 'handleUpdateUserCollectionsSocket',
  HANDLE_UPDATE_AND_SYNC_COLLECTION_SOCKET: 'handleUpdateAndSyncCollectionSocket',
  HANDLE_UPDATE_AND_SYNC_COLLECTIONS_SOCKET: 'handleUpdateAndSyncCollectionSocket',

  // Controllers
  SIGNIN: 'signin',
  SIGNIN_ERROR: 'SIGNIN_ERROR',
  SIGNUP: 'signup',
  SIGNUP_ERROR: 'SIGNUP_ERROR',
  GET_PROFILE: 'getProfile',
  UPDATE_PROFILE: 'updateProfile',
  DELETE_PROFILE: 'deleteProfile',
  GET_USER_BY_ID: 'getUserById',
  GET_ALL_DECKS_FOR_USER: 'getAllDecksForUser',
  UPDATE_AND_SYNC_DECK: 'updateAndSyncDeck',
  CREATE_NEW_DECK: 'createNewDeck',
  CREATE_NEW_COLLECTION: 'createNewCollection',
  GET_ALL_COLLECTIONS_FOR_USER: 'getAllCollectionsForUser',
  UPDATE_AND_SYNC_COLLECTION: 'updateAndSyncCollection',
  DELETE_COLLECTION: 'deleteCollection',
};

const ERROR_TYPES = {
  SERVER_ERROR: (error) => `Server error: ${error.message}`,
  VALIDATION_ERROR: 'Validation Error',
  SECRET_KEY_MISSING: 'Secret key missing',
  UNDEFINED_DATASET: 'Undefined or null dataset',
  UNDEFINED_DATASET_DATA: 'Undefined or null dataset data',
  UNDEFINED_DATASET_NAME: 'Undefined or null dataset name',
  INVALID_COLLECTION_NAME: 'Invalid collection name',
  NON_ARRAY_DATA: 'Data field is not an array',
  INVALID_XY_STRUCTURE: 'Invalid XY structure',
  MISMATCHED_DATA_LENGTH: 'Mismatched data array length',
  INVALID_COLLECTION_STRUCTURE: 'Invalid existing collection structure',
  VERSION_ERROR: 'Version error - no matching document found',
  NOT_FOUND: (resource) => `${resource} not found`,
  DUPLICATE_KEY_ERROR: 'Duplicate key error',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  REQUIRED_FIELDS_MISSING: 'Required fields missing',
  INVALID_USER_DATA: 'Invalid user data',
};

// Log Types
const LOG_TYPES = {
  GENERAL: 'general',
  CARD: 'card',
  CARDS: 'cards',
  COLLECTION: 'collection',
  COLLECTIONS: 'collections',
  OTHER: 'other',
};

const GENERAL = {
  // General
  MAX_RETRIES: 3,
  REQUIRED_FIELDS_MISSING: 'Required fields missing',
  INVALID_USER_DATA: 'Invalid user data',
  DUPLICATE_KEY_ERROR: 'Duplicate key error',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  NOT_FOUND: (resource) => `${resource} not found`,
  FAILED_TO_ENSURE_COLLECTION_EXISTS: 'Failed to ensure collection exists',
  COLLECTION_CHART_DATA_UPDATED: 'Collection and ChartData successfully updated',
  VALIDATION_ERROR: 'Validation Error',
  SERVER_ERROR: (error) => `Server error: ${error.message}`,
  PUBLIC_PATH: path.join(__dirname, '..', 'public'),
  UPLOADED_IMAGES_PATH: path.join(__dirname, '..', 'public', 'images'),
};

const FILE_CONSTANTS = {
  CARDINFO_PHP_JSON: 'cardinfo.php.json',
  CARDINFO_PHP_JSON__PATH: path.join(__dirname, '..', 'data', 'cardinfo.php.json'),
  DOWNLOADED_IMAGES_PATH: path.join(__dirname, '..', 'public', 'images'),
  DOWNLOADED_CARDS_PATH:
    process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '..', 'public', 'images', 'cards')
      : path.join(__dirname, '..', 'data', 'cards'),
};
const lineStyle = { stroke: '#FF8473', strokeWidth: 2 };
let BASE_STAT_CONFIGS = [
  {
    id: 'highPoint',
    name: 'highPoint',
    statKey: 'highPoint',
    label: 'High Point',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'High Point',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'lowPoint',
    statKey: 'lowPoint',
    name: 'lowPoint',
    label: 'Low Point',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Low Point',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'average',
    statKey: 'average',
    name: 'average',
    label: 'Average',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Average',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'percentageChange',
    statKey: 'percentageChange',
    name: 'percentageChange',
    label: 'Percentage Change',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Percentage Change',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'priceChange',
    statKey: 'priceChange',
    name: 'priceChange',
    label: 'Price Change',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Price Change',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'avgPrice',
    statKey: 'avgPrice',
    name: 'avgPrice',
    label: 'Average Price',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Average Price',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'volume',
    statKey: 'volume',
    name: 'volume',
    label: 'Volume',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Volume',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
  {
    id: 'volatility',
    statKey: 'volatility',
    label: 'Volatility',
    name: 'volatility',
    value: 0,
    color: '#FF8473',
    axis: 'y',
    legend: 'Volatility',
    legendOrientation: 'horizontal',
    lineStyle: lineStyle,
  },
];
const DATE_RANGES = [
  {
    id: '24hr',
    points: 24,
    color: '#FF8473',
    type: 'time',
    config: BASE_STAT_CONFIGS,
    format: 'HH:mm',
  },
  {
    id: '7d',
    points: 7,
    color: '#FF8473',
    type: 'date',
    config: BASE_STAT_CONFIGS,
    format: 'YYYY-MM-DD',
  },
  {
    id: '30d',
    points: 30,
    color: '#FF8473',
    type: 'date',
    config: BASE_STAT_CONFIGS,
    format: 'YYYY-MM-DD',
  },
  {
    id: '90d',
    points: 90,
    color: '#FF8473',
    type: 'date',
    config: BASE_STAT_CONFIGS,
    format: 'YYYY-MM-DD',
  },
  {
    id: '180d',
    points: 180,
    color: '#FF8473',
    type: 'date',
    config: BASE_STAT_CONFIGS,
    format: 'YYYY-MM-DD',
  },
  {
    id: '270d',
    points: 270,
    color: '#FF8473',
    type: 'date',
    config: BASE_STAT_CONFIGS,
    format: 'YYYY-MM-DD',
  },
  {
    id: '365d',
    points: 365,
    color: '#FF8473',
    type: 'date',
    config: BASE_STAT_CONFIGS,
    format: 'YYYY-MM-DD',
  },
];
const TIME_RANGES = [
  {
    id: '24h',
    points: 24,
    color: '#FF8473',
    type: 'time',
    config: BASE_STAT_CONFIGS,
    format: 'HH:mm',
  },
];
const DATE_TIME_RANGES = DATE_RANGES.concat(TIME_RANGES);
const generateRangeStatConfigWithLabels = (range) => {
  return BASE_STAT_CONFIGS.map((config) => ({
    ...config,
    label: `${config.label} in last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`,
  }));
};
module.exports = {
  STATUS: STATUS,
  MESSAGES: MESSAGES,
  SOURCES: ERROR_SOURCES,
  GENERAL: GENERAL,
  ERROR_TYPES: ERROR_TYPES,
  LOG_TYPES: LOG_TYPES,
  FILE_CONSTANTS: FILE_CONSTANTS,
  DATE_TIME_RANGES: DATE_RANGES,
  DATE_RANGES: DATE_RANGES,
  TIME_RANGES: TIME_RANGES,
  BASE_STAT_CONFIGS: BASE_STAT_CONFIGS,
  generateRangeStatConfigWithLabels,
};
