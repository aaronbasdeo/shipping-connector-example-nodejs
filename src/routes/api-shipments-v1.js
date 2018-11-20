const express = require('express');
const createError = require('http-errors');
const authMiddleware = require('../middleware/shared-secret-auth');
const shippingService = require('../service/shipping');
const appdirectIntegration = require('../integration/appdirect');

const router = express.Router();

// Authenticate requests to /api/shipments/v1 using shared secret auth
router.use(authMiddleware);

/**
 * Quasi-middleware which is applied to all routes with the appdPartnerId path
 * parameter. It looks up the AppDirect channel which matches the path param,
 * adding the config object to the request context "channelConfig" property.
 *
 * This is implemented inline in route handlers as the path parameters object
 * is not populated until a route is matched.
 *
 * If an AppDirect partner config is not found for the appdPartnerId, a 404
 * response is returned.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function getChannel(req, res, next) {
  const { appdPartnerId } = req.params;
  const config = appdirectIntegration.getChannelConfiguration(appdPartnerId);

  if (!config) {
    next(createError(404, `Unknown channel ID "${appdPartnerId}"`));
  } else {
    req.channelConfig = config;
    next();
  }
}

/**
 * Validate shipping address
 */
router.post('/:appdPartnerId/validateAddress', getChannel, (req, res, next) => {
  return shippingService.validateShippingAddress(req.body)
    .then(response => res.json(response))
    .catch(next);
});

/**
 * Get a quote with rates for a shipment to an address
 */
router.post('/:appdPartnerId/quote', getChannel, (req, res, next) => {
  return shippingService.getQuotes(req.body, req.params.appdPartnerId)
    .then(response => res.json(response))
    .catch(next);
});

/**
 * Create a shipment with a rate and address
 */
router.post('/:appdPartnerId/shipment', getChannel, (req, res, next) => {
  return shippingService.createShipment(req.body)
    .then(response => res.json(response))
    .catch(next);
});

/**
 * Get tracking status of a shipment
 */
router.get('/:appdPartnerId/tracking/status', getChannel, (req, res, next) => {
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
