const _ = require('lodash');

// UPS does not return descriptive names for their services - use this mapping instead
const SERVICE_CODE_NAME_MAPPING = Object.freeze({
  '01': 'UPS Next Day Air',
  '02': 'UPS 2nd Day Air',
  '03': 'UPS Ground',
  '07': 'UPS Worldwide Express',
  '08': 'UPS Worldwide Expedited',
  '11': 'UPS Standard',
  '12': 'UPS 3 Day Select',
  '13': 'UPS Next Day Air Saver',
  '14': 'UPS Next Day Air Early A.M.',
  '54': 'UPS Worldwide Express Plus',
  '59': 'UPS 2nd Day Air A.M.',
  '65': 'UPS Saver',
  '82': 'UPS Today Standard',
  '83': 'UPS Today Dedicated Courier',
  '84': 'UPS Today Intercity',
  '85': 'UPS Today Express',
  '86': 'UPS Today Express Saver',
});

function getServiceLevel(serviceCode) {
  return SERVICE_CODE_NAME_MAPPING[serviceCode] || 'unknown';
}

/**
 * A Rate represents a saved shipping rate price and service level as it relates
 * to a Shipment. UPS doesn't create unique codes for its rates so the connector
 * will generate a UUID that uniquely identifies a rate for a shipment. This UUID
 * is later used to generate a shipment request with the associated parcels and
 * addresses from the original quote.
 */
class Rate {
  constructor(sourceObject) {
    Object.assign(this, sourceObject);
  }

  toResponse() {
    return {
      id: this.uuid,
      carrier: this.carrier,
      serviceLevel: this.serviceLevel,
      price: this.price,
      currencyCode: this.currencyCode,
    };
  }

  toSavedRateModel() {
    return _.pick(this, [
      'id',
      'uuid',
      'shipment',
      'code',
      'carrier',
      'serviceLevel',
      'price',
      'currencyCode',
    ]);
  }

  static fromSavedRateModel(savedRateModel) {
    return new Rate(_.pick(savedRateModel, [
      'id',
      'uuid',
      'shipment',
      'code',
      'carrier',
      'serviceLevel',
      'price',
      'currencyCode',
    ]));
  }

  static fromUPSRate(ratedShipment) {
    const {
      Service: { Code, Description },
      TotalCharges: { CurrencyCode, MonetaryValue }
    } = ratedShipment;

    return new Rate({
      code: Code, // ID is just the ServiceCode from UPS
      carrier: 'UPS',
      serviceLevel: Description || getServiceLevel(Code),
      price: MonetaryValue,
      currencyCode: CurrencyCode,
    });
  }
}

module.exports = Rate;
