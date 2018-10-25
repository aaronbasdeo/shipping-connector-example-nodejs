const config = require('config');
const Parcel = require('./parcel');
const ShippingAddress = require('./shipping-address');
const { validateQuoteRequest } = require('../validation');

const { useNegotiatedRates, shipperInfo } = config.get('integration.ups');

// Pre-populate shipper info from config
const Shipper = {
  Name: shipperInfo.name,
  ShipperNumber: shipperInfo.ShipperNumber,
  Address: {
    AddressLine: [shipperInfo.street1, shipperInfo.street2].filter(Boolean),
    City: shipperInfo.city,
    StateProvinceCode: shipperInfo.stateCode,
    PostalCode: shipperInfo.zip,
    CountryCode: shipperInfo.country,
  },
};

class QuoteRequest {
  constructor(sourceObject) {
    const { shoppingCartId } = sourceObject;

    Object.assign(this, {
      shoppingCartId,
      originAddress: new ShippingAddress(sourceObject.originAddress),
      deliveryAddress: new ShippingAddress(sourceObject.deliveryAddress),
      parcels: sourceObject.parcels.map(Parcel),
    });
  }

  toUPSQuoteRequest() {
    return {
      Shipper, // Populated from config
      ShipTo: this.deliveryAddress.toUPSQuoteRequestAddress(),
      ShipFrom: this.originAddress.toUPSQuoteRequestAddress(),
      Service: {
        Code: '03',
        Description: 'Rate Request',
      },
      Package: [{
        PackagingType: {
          Code: '02',
          Description: 'Rate',
        },
        Dimensions: {
          UnitOfMeasurement: {
            Code: 'IN',
            Description: 'inches',
          },
          Length: '5',
          Width: '4',
          Height: '3',
        },
        PackageWeight: {
          UnitOfMeasurement: {
            Code: 'Lbs',
            Description: 'Pounds',
          },
          Weight: '1',
        },
      }, {
        PackagingType: {
          Code: '02',
          Description: 'Rate',
        },
        Dimensions: {
          UnitOfMeasurement: {
            Code: 'IN',
            Description: 'inches',
          },
          Length: '10',
          Width: '10',
          Height: '10',
        },
        PackageWeight: {
          UnitOfMeasurement: {
            Code: 'Lbs',
            Description: 'Pounds',
          },
          Weight: '20',
        },
      }],
      ShipmentRatingOptions: useNegotiatedRates ? { NegotiatedRatesIndicator: '' } : undefined,
    };
  }

  /**
   * Validates a QuoteRequest-shaped object. Returns the raw response from the jsonschema
   * call.
   *
   * @param {Object} quoteRequest
   */
  static validateQuoteRequest(quoteRequest) {
    return validateQuoteRequest(quoteRequest);
  }

  /**
   * Validates that this QuoteRequest instance is well-formed.
   */
  validate() {
    return validateQuoteRequest(this);
  }
}

module.exports = QuoteRequest;
