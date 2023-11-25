const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const unifiedErrorHandler = require('./unifiedErrorHandler');
const { logToAllSpecializedLoggers } = require('./infoLogger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST_KEY);

// Middleware to add a unique identifier to each request
const addRequestId = (req, res, next) => {
  req.id = uuidv4();
  next();
};

// Helper function to log request details
const logRequestDetails = (req, eventType, message, duration = null) => {
  const logInfo = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    section: eventType,
    message: message,
  };

  if (duration !== null) {
    logInfo.duration = `${duration}ms`;
  }

  logToAllSpecializedLoggers(
    'info',
    `Request ${eventType}: ${req.method} ${req.originalUrl}`,
    { data: logInfo, section: 'request' },
    'log',
  );
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
    console.error('Error processing Stripe payment:', error);
    next(error); // Forward to error handling middleware
  }
};

// Function to apply custom middleware to the express app
function applyCustomMiddleware(app) {
  // Add a unique identifier to each request
  app.use((req, res, next) => {
    req.id = uuidv4();
    next();
  });

  // Stripe payment route
  app.post('/api/stripe/checkout', handleStripePayment);

  // Serve static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Log each request
  app.use((req, res, next) => {
    const start = process.hrtime();
    console.log(`[START] Request ${req.id}: ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const duration = getDurationInMilliseconds(start);
      console.log(`[END] Request ${req.id}: ${duration}ms`);
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
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    unifiedErrorHandler(err, req, res, next);
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
