const config = require('config');
const { validateShipmentRequest } = require('../validation');

const {
  shipperInfo,
  accountNumber,
} = config.get('integration.ups');

// Pre-populate shipper info from config
const Shipper = {
  Name: shipperInfo.name,
  ShipperNumber: shipperInfo.shipperNumber,
  TaxIdentificationNumber: shipperInfo.taxIdentificationNumber,
  Phone: {
    Number: shipperInfo.phone,
  },
  Address: {
    AddressLine: [shipperInfo.street1, shipperInfo.street2].filter(Boolean),
    City: shipperInfo.city,
    StateProvinceCode: shipperInfo.stateCode,
    PostalCode: shipperInfo.zip,
    CountryCode: shipperInfo.country,
  },
};

class ShipmentRequest {
  constructor(sourceObject) {
    Object.assign(this, sourceObject);
  }

  /**
   * Validates that this ShipmentRequest instance is well-formed.
   */
  validate() {
    return validateShipmentRequest(this);
  }

  toUPSShipmentRequest() {
    return {
      Description: 'Created by UPS Shipping Connector',
      Shipper,
      ShipTo: this.deliveryAddress.toUPSShipmentRequestAddress(),
      ShipFrom: this.originAddress.toUPSShipmentRequestAddress(),
      PaymentInformation: {
        ShipmentCharge: {
          Type: '01',
          BillShipper: {
            AccountNumber: accountNumber,
          },
        },
      },
      Service: {
        Code: this.rate.code, // Selected rate code
      },
      Package: this.parcels.map(p => p.toUPSShipmentRequestPackage({ originCountryCode: this.originAddress.country })),
    };
  }
}

module.exports = ShipmentRequest;
