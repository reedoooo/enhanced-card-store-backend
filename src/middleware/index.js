const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logToSpecializedLogger } = require('./infoLogger');
const { logData, logError } = require('../utils/loggingUtils');
const { unifiedErrorHandler } = require('./unifiedErrorHandler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST_KEY);
require('colors');
const logRequestDetails = (req, eventType, message, duration = null) => {
  const logInfo = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    section: eventType,
    message: message,
    data: {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    },
  };

  if (duration !== null) {
    logInfo.duration = `${duration}ms`;
  }

  logToSpecializedLogger('info', `Request ${eventType}: ${req.method} ${req.originalUrl}`, {
    data: logInfo,
    section: 'request',
  });
  // console.log('req.body', req.body.cards);
  if (req.body.cards) {
    logData(req.body.cards[0]);
  }
  if (req.body.card) {
    logData(req.body.card);
  }
  if (req.body.allXYValues) {
    logData('allXYValues', req.body.allXYValues[0]);
  }
  if (req.body.updatedCollection) {
    logData(req.body.updatedCollection);
  }

  // logData('LOGGING REQUEST BODY', req.body);
};

const handleStripePayment = async (req, res, next) => {
  try {
    // Extract payment details from request
    const { amount, currency, source } = req.body;

    // Create a charge using Stripe
    const charge = await stripe.charges.create({
      amount, // Amount to be charged
      currency, // Currency
      source, // Payment source, usually a token from Stripe Elements
      description: 'Example charge', // Description for the charge
    });

    res.status(200).json(charge);
  } catch (error) {
    logError('Error processing Stripe payment', error.message, null, { error, reqId: req.id });
    next(error); // Forward to error handling middleware
  }
};

function applyCustomMiddleware(app) {
  app.use((req, res, next) => {
    req.id = uuidv4();
    next();
  });

  app.post('/api/stripe/checkout', handleStripePayment);

  app.use(express.static(path.join(__dirname, 'public')));

  app.use((req, res, next) => {
    const start = process.hrtime();
    console.log('[START]'.green + `Request ${req.id}: ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const duration = getDurationInMilliseconds(start);
      console.log('[END]'.red + `Request ${req.id}: ${duration}ms`);
      // console.log(`[END] Request ${req.id}: ${res.statusCode} ${res.statusMessage}`);
      logRequestDetails(
        req,
        'completed',
        `Request completed with status ${res.statusCode}`,
        duration,
      );
    });

    next();
  });

  // Unified error-handling middleware
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    unifiedErrorHandler(error, req, res, next);
  });
}

// Helper function to get duration in milliseconds
function getDurationInMilliseconds(start) {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}
module.exports = applyCustomMiddleware;
