const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const unifiedErrorHandler = require('./unifiedErrorHandler');
const { logToAllSpecializedLoggers } = require('./infoLogger');

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

// Helper function to get duration in milliseconds
const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

// Function to apply custom middleware to the express app
const applyCustomMiddleware = (app, server) => {
  app.use(addRequestId);

  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());

  // Middleware to log request on start and finish with duration
  app.use((req, res, next) => {
    const start = process.hrtime();
    logRequestDetails(req, 'start', '[START]');

    res.on('finish', () => {
      const durationInMilliseconds = getDurationInMilliseconds(start);
      logRequestDetails(req, 'end', '[END]', durationInMilliseconds);
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
};

module.exports = applyCustomMiddleware;
