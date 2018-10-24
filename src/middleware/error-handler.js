/**
 * Error handler middleware. Intercepts Errors thrown in route handlers and
 * maps them to an HTTP response. If an Error's statusCode property is set,
 * it will set the HTTP status code (default is 500).
 *
 * An optional "context" property can be attached to the error and will be
 * returned as-is in the response.
 *
 * @param {Error} err  
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function errorHandlerMiddleware(err, req, res, next) {
  console.error(err);

  const { statusCode = 500, name, message, errorCode, errorDetail, context } = err;

  return res.status(statusCode).json({
    errorCode: errorCode || name,
    errorDetail: errorDetail || message,
    tag: req.requestId,
    context,
  });
}

module.exports = errorHandlerMiddleware;
