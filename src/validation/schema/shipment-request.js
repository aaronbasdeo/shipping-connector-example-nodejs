module.exports = {
  id: '/ShipmentRequest',
  type: 'object',
  additionalProperties: false, // Disallow extra properties
  properties: {
    shoppingCartId: { type: 'string' },
    rateId: { type: 'string' },
  },
  required: ['shoppingCartId', 'rateId'],
};
