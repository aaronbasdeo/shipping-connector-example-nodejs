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
  labelFormat,
} = config.get('integration.ups');

/**
 * Builds a request body for a UPS request. Note that UPS requires the username and password
 * even when providing an API access key.
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
 * - UPS API often returns 200 when an error occurs so you need to inspect the response body to detect errors.
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
 * The address param should be a well-formed, UPS-format address object.
 *
 * This function returns the raw UPS response object if it indicates a successful
 * request; otherwise, this call will throw an Error representing the UPS fault.
 *
 * @param {Object} address
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
        AddressKeyFormat: address,
      },
    }),
  };

  return request.post(options)
    .then(detectAndThrowError);
}

/**
 * Sends a Rates request using the UPS Rates API. Shipments containing multiple
 * parcels can be rated; in this scenario, the API will return multiple rates
 * and a total.
 *
 * This function returns the raw UPS response object if it indicates a successful
 * request; otherwise, this call will throw an Error representing the UPS fault.
 *
 * @param {Object} quoteRequest
 */
function sendQuotesRequest(quoteRequest) {
  const options = {
    uri: `${baseUrl}/Rate`,
    json: true,
    body: buildRequestBody({
      RateRequest: {
        Request: {
          RequestOption: 'Shop', // Get list of rates
        },
        Shipment: quoteRequest,
      },
    }),
  };

  return request.post(options)
    .then(detectAndThrowError);
}

/**
 * Sends a shipment creation request to UPS.
 *
 * This function returns the raw UPS response object if it indicates a successful
 * request; otherwise, this call will throw an Error representing the UPS fault.
 */
function sendShipmentRequest(shipmentRequest) {
  const options = {
    uri: `${baseUrl}/Ship`,
    json: true,
    body: buildRequestBody({
      ShipmentRequest: {
        Request: {
          RequestOption: 'validate',
        },
        Shipment: shipmentRequest,
        LabelSpecification: {
          LabelImageFormat: {
            Code: labelFormat,
          },
        },
      },
    }),
  };

  return request.post(options)
    .then(detectAndThrowError);
}

/**
 * Sends a shipment status request to UPS. UPS responds with the entire
 * shipment object - this function returns the entire response object.
 *
 * This function returns the raw UPS response object if it indicates a successful
 * request; otherwise, this call will throw an Error representing the UPS fault.
 *
 * @param {String} trackingId
 */
function sendTrackingRequest(trackingId) {
  const options = {
    uri: `${baseUrl}/Track`,
    json: true,
    body: buildRequestBody({
      TrackRequest: {
        Request: {
          RequestOption: '1',
          TransactionReference: {
             CustomerContext: 'Just a test'
          }
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
