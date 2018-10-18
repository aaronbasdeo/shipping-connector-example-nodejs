const express = require('express');
const createError = require('http-errors');
const authMiddleware = require('../middleware/shared-secret-auth');
const upsIntegration = require('../integration/ups');
const appdirectIntegration = require('../integration/appdirect');

const router = express.Router();

// Authenticate requests to /api/shipments/v1 using shared secret auth
router.use(authMiddleware);

/**
 * Quasi-middleware which is applied to all routes with the appdChannelId path
 * parameter. It looks up the AppDirect channel which matches the path param,
 * adding the config object to the request context "channelConfig" property.
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

router.post('/:appdChannelId/validateAddress', getChannel, (req, res, next) => {
  return upsIntegration.sendAddressValidationRequest()
    .then(res.json)
    .catch(next);
});

router.post('/:appdChannelId/quote', getChannel, (req, res, next) => {
  return upsIntegration.sendQuotesRequest()
    .then(res.json)
    .catch(next);
});

router.post('/:appdChannelId/shipment', getChannel, (req, res, next) => {
  return upsIntegration.sendShipmentRequest()
    .then(res.json)
    .catch(next);
});

router.get('/:appdChannelId/tracking/status', getChannel, (req, res, next) => {
  // Parse query args
  let { trackingNumber = '' } = req.query;

  trackingNumber = trackingNumber.trim();

  if (!trackingNumber) {
    return next(createError(400, 'The "trackingNumber" query param is required'));
  }

  return upsIntegration.sendTrackingRequest(trackingNumber)
    .then(response => res.json(response))
    .catch(error => next(error));
});

module.exports = router;
