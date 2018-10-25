const { validateShippingAddress } = require('../validation');

/**
 * The ShippingAddress entity represents a generic address that is consumed
 * and produced by the Shipping Connector. It provides convenience functions
 * to convert to/from UPS address. It also provides validation functions
 * using JSONSchema.
 */
class ShippingAddress {
  constructor(srcObject) {
    Object.assign(this, srcObject);
  }

  getNameValue() {
    return [this.name, this.company].filter(Boolean).join(', ');
  }

  getAddressLineValue() {
    return [this.street1, this.street2].filter(Boolean).join(', ');
  }

  /**
   * Converts this ShippingAddress to the UPS format.
   */
  toUPSValidationAddress() {
    return {
      // ConsigneeName is a person or business (or concatenation if both are present)
      ConsigneeName: this.getNameValue(),

      // Input has two address lines, so concat them into one comma-separated line
      AddressLine: this.getAddressLineValue(),
      PoliticalDivision2: this.city,
      PoliticalDivision1: this.stateCode,
      PostcodePrimaryLow: this.zip,
      CountryCode: this.country,
    };
  }

  toUPSQuoteRequestAddress() {
    return {
      Name: this.getNameValue(),
      Address: {
        AddressLine: this.getAddressLineValue(),
        City: this.city,
        StateProvinceCode: this.stateCode,
        PostalCode: this.zip,
        CountryCode: this.country,
      },
    };
  }

  /**
   * Accepts a UPS address in AddressKeyFormat and builds a (partial by default)
   * ShippingAddress from it.
   *
   * The resulting ShippingAddress will not include name, company, phone, or e-mail unless
   * these values are provided in a hash as the second parameter of this function.
   *
   * @param {Object} upsAddress
   * @param {Object} options
   */
  static fromUPSAddress(upsAddress, { name, company, phone, email } = {}) {
    const streets = upsAddress.AddressLine;

    const [street1, street2] = Array.isArray(streets) ? streets : [streets];
    const {
      PoliticalDivision2: city,
      PoliticalDivision1: stateCode,
      PostcodePrimaryLow: zip,
      CountryCode: country,
    } = upsAddress;

    return new ShippingAddress({
      name,
      company,
      street1,
      street2,
      city,
      stateCode,
      zip,
      country,
      phone,
      email,
    });
  }

  /**
   * Validates a ShippingAdress using a schema. This implementation either returns false
   * (no validation errors) or a non-empty array of { field, message } objects which
   * represent field-level errors.
   *
   * @param {ShippingAddress} address
   */
  static validateAddress(address) {
    const validation = validateShippingAddress(address);

    let validationResult = false;

    if (!validation.valid) {
      validationResult = validation.errors.map((error) => {
        // jsonschema returns inconsistent properties depending on the validation error - try to make them consistent
        switch (error.name) {
          case 'type': return { field: error.property.split('.').slice(-1)[0], message: 'incorrect.type' };
          case 'required': return { field: error.argument, message: 'required' };
          case 'additionalProperties': return { field: error.argument, message: 'not.allowed' };
          default: return { field: error.argument, message: error.name }
        }
      });
    }

    return validationResult;
  }

  validate() {
    return ShippingAddress.validateAddress(this);
  }
}

module.exports = ShippingAddress;
