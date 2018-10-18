/**
 * A collection of request helpers for the UPS API.
 *
 * Unless otherwise noted, all request helpers return Promises.
 */

const request = require('request-promise-native');
const config = require('config');
const { buildQueryString } = require('./utils');

const { accessKey, baseUrl, trackingBaseUrl } = config.get('integration.ups');

/**
 * Builds a request body for a UPS request.
 *
 * Automatically includes the UPSSecurity object with authentication credentials.
 *
 * @param {Object} bodyObject
 */
function buildRequestBody(bodyObject) {
  return Object.assign({
    UPSSecurity: {
      ServiceAccessToken: {
        AccessLicenseNumber: accessKey,
      },
    },
  }, bodyObject);
}

function buildTrackingUrl(trackingId) {
  const queryString = buildQueryString({
    trackNums: trackingId,
    'track.x': 'track',
  });

  return `${trackingBaseUrl}?${queryString}`;
}

function sendAddressValidationRequest() {
  return Promise.reject(new Error('Not implemented yet'));
}

function sendQuotesRequest() {
  return Promise.reject(new Error('Not implemented yet'));
}

function sendShipmentRequest() {
  return Promise.reject(new Error('Not implemented yet'));
}

function sendTrackingRequest(trackingId) {
  const options = {
    uri: `${baseUrl}/Track`,
    json: true,
    body: buildRequestBody({
      TrackRequest: {
        Request: {
          RequestAction: 'Track',
          RequestOption: 'activity',
        },
        InquiryNumber: trackingId,
      },
    }),
  };

  return request.post(options);
}

module.exports = {
  sendAddressValidationRequest,
  sendQuotesRequest,
  sendShipmentRequest,
  sendTrackingRequest,
};
