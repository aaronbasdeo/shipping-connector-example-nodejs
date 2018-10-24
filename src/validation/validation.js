const { Validator } = require('jsonschema');

const shippingAddressSchema = require('./schema/shipping-address');

const validator = new Validator();

validator.addSchema(shippingAddressSchema, shippingAddressSchema.id);

function validateShippingAddress(shippingAddress) {
  return validator.validate(shippingAddress, shippingAddressSchema.id);
}

module.exports = {
  validateShippingAddress,
};
