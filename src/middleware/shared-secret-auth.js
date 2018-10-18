const createError = require('http-errors');
const config = require('config');

const sharedAuthSecret = config.get('sharedAuthSecret');

/**
 * Auth middleware. Authentication here is implemented using a pre-shared token.
 *
 * Requests must contain a bearer token that matches the one configured for this
 * connector.
 *
 * Invalid token types or a token mismatch result in a 401 response.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function sharedSecretMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [tokenType = '', token = ''] = authHeader.split(' ');

  if (tokenType.toLowerCase().trim() !== 'bearer') {
    return next(createError(401, 'Invalid auth token type (expected bearer token)'));
  } else if (!sharedAuthSecret || token !== sharedAuthSecret) {
    return next(createError(401, 'Unauthorized'));
  } else {
    return next();
  }
}

module.exports = sharedSecretMiddleware;
