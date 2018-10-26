const { Validator } = require('jsonschema');

const shippingAddressSchema = require('./schema/shipping-address');
const quoteRequestSchema = require('./schema/quote-request');
const parcelSchema = require('./schema/parcel');

const validator = new Validator();

validator.addSchema(shippingAddressSchema, shippingAddressSchema.id);
validator.addSchema(quoteRequestSchema, quoteRequestSchema.id);
validator.addSchema(parcelSchema, parcelSchema.id);

function validateShippingAddress(shippingAddress) {
  return validator.validate(shippingAddress, shippingAddressSchema.id);
}

function validateQuoteRequest(quoteRequest) {
  return validator.validate(quoteRequest, quoteRequestSchema.id);
}

module.exports = {
  validateShippingAddress,
  validateQuoteRequest,
};
