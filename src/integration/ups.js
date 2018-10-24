/**
 * A collection of request helpers for the UPS API.
 *
 * Unless otherwise noted, all request helpers return Promises.
 */
const request = require('request-promise-native');
const config = require('config');
const createError = require('http-errors');

const {
  accessKey,
  username,
  password,
  baseUrl,
} = config.get('integration.ups');

/**
 * Builds a request body for a UPS request.
 *
 * Automatically includes the UPSSecurity object with authentication credentials.
 *
 * The passed bodyObject will be merged directly into the base UPS request body.
 *
 * @param {Object} bodyObject
 */
function buildRequestBody(bodyObject) {
  return Object.assign({
    UPSSecurity: {
      UsernameToken: {
        Username: username,
        Password: password,
      },
      ServiceAccessToken: {
        AccessLicenseNumber: accessKey,
      },
    },
  }, bodyObject);
}

/**
 * Inspects a UPS API response for an error condition. If an error is detected, this function
 * attempts to map it to a standardized error object that will be returned to the user to
 * indicate a problem in the UPS service or a bug in the shipping connector.
 *
 * Some remarks:
 * - UPS API often returns 200 when an error occurs so you need to inspect the response body to detect errors
 * - According to the UPS documentation, all error responses (Faults) will have some common fields including
 *   a faultCode which refers back to their troubleshooting guide.
 * - This function returns 400 if the fault indicates a client-side problem or a 502 if the problem is on the
 *   UPS end.
 *
 * @param {Object} responseBody
 */
function detectAndThrowError(responseBody) {
  if (responseBody.Fault) {
    const {
      faultcode,
      detail: { Errors: { ErrorDetail: { PrimaryErrorCode: { Code, Description } } } },
    } = responseBody.Fault;
    const statusCode = faultcode === 'Client' ? 400 : 502;
    const errorString = `UPS error: ${Description}`;
    throw createError(statusCode, errorString, { errorCode: `UPS-${faultcode}-${Code}`, context: responseBody });
  }
  return responseBody;
}

/**
 * Sends an Address Validation request using UPS street-level validation.
 *
 * @param {ShippingAddress} address
 */
function sendAddressValidationRequest(address) {
  const options = {
    uri: `${baseUrl}/XAV`,
    json: true,
    body: buildRequestBody({
      XAVRequest: {
        Request: {
          RequestAction: 'XAV',
          RequestOption: '1', // Perform address validation (1), not classification (2)
        },
        AddressKeyFormat: address.toUPSAddress(),
      },
    }),
  };

  return request.post(options)
    .then(detectAndThrowError);
}

function sendQuotesRequest() {
  return Promise.reject(createError(501, 'Not implemented yet'));
}

function sendShipmentRequest() {
  return Promise.reject(createError(501, 'Not implemented yet'));
}

function sendTrackingRequest(trackingId) {
  const options = {
    uri: `${baseUrl}/Track`,
    json: true,
    body: buildRequestBody({
      TrackRequest: {
        Request: {
          RequestAction: 'Track',
        },
        InquiryNumber: trackingId,
      },
    }),
  };

  return request.post(options)
    .then(detectAndThrowError);
}

module.exports = {
  sendAddressValidationRequest,
  sendQuotesRequest,
  sendShipmentRequest,
  sendTrackingRequest,
};
