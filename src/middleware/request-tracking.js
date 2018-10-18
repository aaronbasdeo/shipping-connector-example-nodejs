const randomstring = require('randomstring');

const REQUEST_ID_HEADER_NAME = 'X-ShippingConnector-Request-Id';

/**
 * Generate a unique request ID with the specified length (default: 16 bytes)
 */
function generateRequestId(length = 16) {
  return randomstring.generate({ length });
}

/**
 * Inject request ID into a response header and the request context for route
 * handlers to use.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function injectRequestId(req, res, next) {
  const requestId = generateRequestId();

  // Set the request ID in the response header
  res.append(REQUEST_ID_HEADER_NAME, requestId);

  // Set the request ID in the request context
  req.requestId = requestId;

  return next();
}

module.exports = injectRequestId;
