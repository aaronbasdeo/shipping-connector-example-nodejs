const randomstring = require('randomstring');

const REQUEST_ID_HEADER_NAME = 'X-ShippingConnector-Request-Id';
const REQUEST_ID_LENGTH = 16;

/**
 * Inject request ID into a response header and the request context for route
 * handlers to use. The request ID is used to identify all log messages associated
 * with a single request when debugging an issue by reading the logs.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function injectRequestId(req, res, next) {
  const requestId = randomstring.generate({ length: REQUEST_ID_LENGTH });

  // Set the request ID in the response header
  res.append(REQUEST_ID_HEADER_NAME, requestId);

  // Set the request ID in the request context
  req.requestId = requestId;

  return next();
}

module.exports = injectRequestId;
