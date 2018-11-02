const createError = require('http-errors');
const { ShippingAddress, Rate } = require('../entities');

// When an ambiguous address is validated, limit the number of candidates
const CANDIDATE_ADDRESS_LIMIT = 5;

function parseUPSAddressValidationResponse(responseBody, address) {
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
}

function parseUPSRatesResponse(responseBody) {
  // Parse rates from UPS response
  const { RateResponse: { RatedShipment } } = responseBody;

  // Coerce UPS rates to an array
  const ratedShipmentArray = Array.isArray(RatedShipment)
    ? RatedShipment
    : [RatedShipment];

  return ratedShipmentArray.map(Rate.fromUPSRate);
}

function parseUPSShipmentRequestResponse(responseBody) {
  const {
    ShipmentResponse: {
      ShipmentResults: {
        ShipmentCharges: {
          TotalCharges: {
            CurrencyCode: chargeCurrency,
            MonetaryValue: chargeAmount,
          },
        },
        BillingWeight: {
          UnitOfMeasurement: {
            Code: weightUnits,
          },
          Weight: weightAmount,
        },
        ShipmentIdentificationNumber: shipmentNumber,
        PackageResults: {
          TrackingNumber: trackingNumber,
          ShippingLabel: {
            ImageFormat: {
              Code: labelFormat,
            },
            GraphicImage: labelData,
          }
        }
      }
    }
  } = responseBody;

  return {
    shipmentNumber,
    trackingNumber,
    chargeAmount,
    chargeCurrency,
    weightUnits,
    weightAmount,
    labelFormat,
    labelData,
  };
}

module.exports = {
  parseUPSAddressValidationResponse,
  parseUPSRatesResponse,
  parseUPSShipmentRequestResponse,
};
