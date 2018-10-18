const express = require('express');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const shipmentsV1Router = require('./routes/api-shipments-v1');
const errorHandlerMiddleware = require('./middleware/error-handler');
const requestTrackingMiddleware = require('./middleware/request-tracking');

const app = express();

// Middleware: log requests
app.use(logger('dev'));

// Middleware: parse JSON from req bodies
app.use(express.json());

// Middleware: inject request tracking ID into context
app.use(requestTrackingMiddleware);

// Mount routes
app.use('/', indexRouter);
app.use('/api/shipments/v1', shipmentsV1Router);

// "Route Not Found" middleware - return a 404 and JSON response
app.use((req, res, next) => {
  const err = new Error('Not found');
  err.statusCode = 404;

  return next(err);
});

// Middleware: error handling (converts Errors to HTTP responses)
app.use(errorHandlerMiddleware);

module.exports = app;
