const express = require('express');
const createError = require('http-errors');
const authMiddleware = require('../middleware/shared-secret-auth');
const shippingService = require('../service/shipping');
const appdirectIntegration = require('../integration/appdirect');

const router = express.Router();

// Authenticate requests to /api/shipments/v1 using shared secret auth
router.use(authMiddleware);

/**
 * Quasi-middleware which is applied to all routes with the appdChannelId path
 * parameter. It looks up the AppDirect channel which matches the path param,
 * adding the config object to the request context "channelConfig" property.
 *
 * This is implemented inline in route handlers as the path parameters object
 * is not populated until a route is matched.
 *
 * If an AppDirect channel config is not found for the appdChannelId, a 404
 * response is returned.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function getChannel(req, res, next) {
  const { appdChannelId } = req.params;
  const config = appdirectIntegration.getChannelConfiguration(appdChannelId);

  if (!config) {
    next(createError(404, `Unknown channel ID "${appdChannelId}"`));
  } else {
    req.channelConfig = config;
    next();
  }
}

/**
 * Validate shipping address
 */
router.post('/:appdChannelId/validateAddress', getChannel, (req, res, next) => {
  if (!req.body) {
    throw createError(400, 'Malformed request');
  }

  return shippingService.validateShippingAddress(req.body)
    .then(response => res.json(response))
    .catch(next);
});

/**
 * Get a quote with rates for a shipment to an address
 */
router.post('/:appdChannelId/quote', getChannel, (req, res, next) => {
  return shippingService.getQuotes()
    .then(res.json)
    .catch(next);
});

/**
 * Create a shipment with a rate and address
 */
router.post('/:appdChannelId/shipment', getChannel, (req, res, next) => {
  return shippingService.createShipment()
    .then(res.json)
    .catch(next);
});

/**
 * Get tracking status of a shipment
 */
router.get('/:appdChannelId/tracking/status', getChannel, (req, res, next) => {
  // Parse query args
  let { trackingNumber = '' } = req.query;

  if (!trackingNumber) {
    return next(createError(400, 'The "trackingNumber" query param is required'));
  }

  return shippingService.getTrackingStatus(trackingNumber)
    .then(response => res.json(response))
    .catch(next);
});

module.exports = router;
