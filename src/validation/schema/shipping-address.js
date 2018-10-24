module.exports = {
  id: '/ShippingAddress',
  type: 'object',
  additionalProperties: false, // Disallow extra properties
  properties: {
    name: { type: 'string' },
    company: { type: 'string' },
    street1: { type: 'string' },
    street2: { type: 'string' },
    city: { type: 'string' },
    stateCode: { type: 'string' },
    country: { type: 'string' },
    zip: { type: 'string' },
    phone: { type: 'string' },
    email: { type: 'string' },
  },
  required: ['name', 'street1', 'city', 'stateCode', 'country', 'zip'],
};
