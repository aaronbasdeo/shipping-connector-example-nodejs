/**
 * Obtains a human-readable error code from an HTTP Status code.
 *
 * @param {int} status
 */
function mapStatusToErrorCode(status) {
  switch (status) {
    case 400: return 'BadInput';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'NotFound';
    default: return 'Error';
  }
}

/**
 * Error handler middleware. Intercepts Errors thrown in route handlers and
 * maps them to an HTTP response. If an Error's statusCode property is set,
 * it will set the HTTP status code (default is 500).
 *
 * @param {Error} err  
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function errorHandlerMiddleware(err, req, res, next) {
  const { statusCode = 500, message, errorCode, errorDetail } = err;

  return res.status(statusCode).json({
    errorCode: errorCode || mapStatusToErrorCode(statusCode),
    errorDetail: errorDetail || message,
    tag: req.requestId,
  });
}

module.exports = errorHandlerMiddleware;
