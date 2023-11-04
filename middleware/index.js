const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// const winston = require('winston');
const unifiedErrorHandler = require('./unifiedErrorHandler');
const { logToAllSpecializedLoggers } = require('./infoLogger');
// const { responseLogger } = require('./infoLogger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const addRequestId = (req, res, next) => {
  req.id = uuidv4(); // Add a unique identifier to each request
  next();
};

const connectionLogger = (req, res, next) => {
  // We now delegate logging to the specialized logging function
  logToAllSpecializedLoggers('info', `Incoming ${req.method} request to ${req.originalUrl}`, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    section: 'general', // Assuming 'connection' is a valid section
  });
  next();
};

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded!');
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed!');
      break;
    default:
      return res.status(400).end();
  }

  res.json({ received: true });
};
const applyCustomMiddleware = (app, server) => {
  app.use(addRequestId);

  // Replace console.log with the connectionLogger middleware for request logging
  app.use(connectionLogger);

  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());

  // Unified error-handling middleware
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    unifiedErrorHandler(err, req, res, next);
  });

  app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.use((req, res, next) => {
    const startTime = Date.now();
    // let logged = false; // Flag to control logging

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logToAllSpecializedLoggers('info', `API [${req.method}] request finished`, {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        section: 'response', // Assuming 'response' is a valid section
      });
    });

    next();
  });
  app.use(unifiedErrorHandler);
};

module.exports = applyCustomMiddleware;
