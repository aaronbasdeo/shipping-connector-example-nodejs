module.exports = {
  id: '/QuoteRequest',
  type: 'object',
  additionalProperties: false, // Disallow extra properties
  properties: {
    shoppingCartId: { type: 'string' },
    originAddress: { '$ref': '/ShippingAddress' },
    deliveryAddress: { '$ref': '/ShippingAddress' },
    parcels: { type: 'array', items: { type: 'string' } },
  },
  required: ['shoppingCartId', 'originAddress', 'deliveryAddress', 'parcels'],
};
