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

class Rate {
  constructor(sourceObject) {
    Object.assign(this, sourceObject);
  }

  static fromUPSRate(ratedShipment) {
    const {
      Service: { Code, Description },
      TotalCharges: { CurrencyCode, MonetaryValue }
    } = ratedShipment;

    return new Rate({
      id: Code, // ID is just the ServiceCode from UPS
      carrier: 'UPS',
      serviceLevel: Description || getServiceLevel(Code),
      price: MonetaryValue,
      currencyCode: CurrencyCode,
    });
  }
}

module.exports = Rate;