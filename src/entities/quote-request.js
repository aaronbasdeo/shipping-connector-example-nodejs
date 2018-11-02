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

/**
 * A QuoteRequest represents the input fields provided in order to request shipping
 * quotes from UPS.
 */
class QuoteRequest {
  constructor(sourceObject) {
    const { shoppingCartId } = sourceObject;

    Object.assign(this, {
      shoppingCartId,
      originAddress: new ShippingAddress(sourceObject.originAddress),
      deliveryAddress: new ShippingAddress(sourceObject.deliveryAddress),
      parcels: sourceObject.parcels.map(p => new Parcel(p)),
    });
  }

  toUPSQuoteRequest() {
    return {
      Shipper, // Populated from config
      ShipTo: this.deliveryAddress.toUPSQuoteRequestAddress(),
      ShipFrom: this.originAddress.toUPSQuoteRequestAddress(),
      Package: this.parcels.map(parcel => parcel.toUPSQuoteRequestPackage({ originCountryCode: this.originAddress.country })),
      ShipmentRatingOptions: useNegotiatedRates ? { NegotiatedRatesIndicator: '' } : undefined,
    };
  }

  toShipmentModel() {
    const { shoppingCartId } = this;
    const originAddressModel = this.originAddress.toAddressModel();
    const deliveryAddressModel = this.deliveryAddress.toAddressModel();
    const parcelModels = this.parcels.map(p => p.toParcelModel());

    return {
      shoppingCartId,
      originAddressModel,
      deliveryAddressModel,
      parcelModels,
    };
  }

  /**
   * Validates that this QuoteRequest instance is well-formed.
   */
  validate() {
    return validateQuoteRequest(this);
  }
}

module.exports = QuoteRequest;
