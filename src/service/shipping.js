const createError = require('http-errors');
const upsIntegration = require('../integration/ups');
const { ShippingAddress, Shipment, QuoteRequest, Rate } = require('../entities');

// Countries which can have addresses validated by UPS
const SUPPORTED_ADDRESS_VALIDATION_COUNTRIES = ['US'];

// When an ambiguous address is validated, limit the number of candidates
const CANDIDATE_ADDRESS_LIMIT = 5;

/**
 * Validates a shipping address with UPS.
 *
 * Some local validation is performed to ensure that the address object
 * is well-formed according to the Shipping Connector spec.
 *
 * It also enforces business constraints such as limiting the address
 * validation to US addresses (due to UPS limitations).
 *
 * Finally, it makes the API call to UPS and parses the response to determine
 * if the address is valid or not. UPS normalizes the addresses using the USPS
 * database instead of validating individual address fields. This means that
 * an address is considered "invalid" by UPS if it does not match any address.
 *
 * Another case is where the address is ambiguous, matching 2 + addresses
 * in the USPS database. In the current Shipping Connector spec, this is an
 * invalid address. Candidate addresses are returned in the response context
 * to assist with debugging for now.
 *
 * A successful validation results in the candidate address being returned.
 *
 * @param {Object} rawAddress
 */
function validateShippingAddress(rawAddress) {
  const address = new ShippingAddress(rawAddress);

  // Check for malformed payload (missing props, wrong types, etc)
  const validationErrors = address.validate();
  if (validationErrors) {
    throw createError(422, 'Invalid address', {
      errorCode: 'invalid.address',
      errorDetail: {
        message: 'address.is.malformed',
        detail: validationErrors,
      },
    });
  }

  // Business constraint: UPS only supports address validation on US addresses.
  // If the provided address is not US, return 501 NOT IMPLEMENTED.
  if (!SUPPORTED_ADDRESS_VALIDATION_COUNTRIES.includes(address.country)) {
    throw createError(501, 'Unsupported country', {
      errorCode: 'unsupported.country',
      errorDetail: 'country.cannot.be.validated.by.ups',
    });
  }

  return upsIntegration.sendAddressValidationRequest(address.toUPSValidationAddress())
    .then((responseBody) => {
      // responseBody is the raw response body from UPS - extract indicators
      const {
        XAVResponse: { ValidAddressIndicator, AmbiguousAddressIndicator, NoCandidatesIndicator }
      } = responseBody;

      // Use these input fields to augment candidate addresses from UPS for responses - required
      // because UPS does not return these properties in candidate addresses
      const { name, company, phone, email } = address;

      // UPS indicators are either omitted or present with a value of ''
      if (ValidAddressIndicator === '') {
        // Valid address - return it
        const candidateAddress = ShippingAddress.fromUPSAddress(
          responseBody.XAVResponse.Candidate.AddressKeyFormat, {
            name,
            company,
            phone,
            email,
          });

        return { candidateAddress };
      } else if (AmbiguousAddressIndicator === '') {
        // Ambiguous address matches multiple addresses in USPS database

        // Build array of candidate addresses to return in context
        const candidateAddresses = responseBody.XAVResponse.Candidate.slice(0, CANDIDATE_ADDRESS_LIMIT)
          .map(candidate => ShippingAddress.fromUPSAddress(candidate.AddressKeyFormat, { name, company, phone, email }));

        throw createError(422, 'Invalid address', {
          errorCode: 'invalid.address',
          errorDetail: {
            message: 'ambiguous.address.multiple.results',
            detail: [],
          },
          context: { candidateAddresses },
        });
      } else if (NoCandidatesIndicator === '') {
        // No matching addresses are found
        throw createError(422, 'Invalid address', {
          errorCode: 'invalid.address',
          errorDetail: {
            message: 'no.matching.addresses.found',
            detail: [],
          },
        });
      } else {
        throw createError(500, 'Unexpected response from UPS API', { context: responseBody });
      }
    });
}

function getQuotes(rawQuoteRequest) {
  const quoteRequest = new QuoteRequest(rawQuoteRequest);

  // Check whether the raw quote request is well-formed
  const validationResult = quoteRequest.validate();

  if (!validationResult.valid) {
    throw createError(400, 'Quote request body is invalid', {
      context: { errors: validationResult.errors }
    });
  }

  return upsIntegration.sendQuotesRequest(quoteRequest.toUPSQuoteRequest())
    .then((responseBody) => {
      const { RateResponse: { RatedShipment } } = responseBody;

      const ratedShipmentArray = Array.isArray(RatedShipment)
        ? RatedShipment
        : [RatedShipment];

      return ratedShipmentArray.map(Rate.fromUPSRate);
    });
}

/**
 * TODO
 */
function createShipment() {
  // TODO
  return upsIntegration.sendShipmentRequest();
}

/**
 * Gets the status of a UPS shipment by tracking ID. Given a valid tracking ID,
 * fetches the latest tracking status for the parcel referenced by the tracking ID.
 *
 * If multiple packages are included in a shipment, the Shipping Connector will
 * pick out the package that corresponds to the tracking ID. Each package has its own
 * tracking ID and getting the status of any of these IDs will return the same shipment
 * with multiple packages.
 *
 * At this time, only UPS Parcels are supported by this tracking API. UPS Freight is
 * not supported.
 *
 * A successful request will return a Shipment object, which contains
 * the tracking ID, shipment ID (same as the tracking ID), status URL, status code,
 * and status text.
 *
 * @param {String} trackingId
 */
function getTrackingStatus(trackingId) {
  return upsIntegration.sendTrackingRequest(trackingId)
    .then((responseBody) => {
      try {
        return Shipment.fromUPSShipment(responseBody.TrackResponse.Shipment);
      } catch (err) {
        throw createError(502, 'UPS returned an invalid TrackingStatus response', {
          context: { cause: err.message },
        });
      }
    });
}

module.exports = {
  validateShippingAddress,
  getQuotes,
  createShipment,
  getTrackingStatus,
};
