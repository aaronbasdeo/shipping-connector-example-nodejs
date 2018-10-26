module.exports = {
  id: '/Parcel',
  type: 'object',
  additionalProperties: false, // Disallow extra properties
  properties: {
    length: { type: 'number', minimum: 0 },
    width: { type: 'number', minimum: 0 },
    height: { type: 'number', minimum: 0 },
    lengthUnit: {
      type: 'string',
      enum: ['cm', 'in', 'ft', 'mm', 'm', 'yd'],
    },
    weight: { type: 'number', minimum: 0 },
    weightUnit: {
      type: 'string',
      enum: ['g', 'kg', 'oz', 'lb'],
    },
  },
  required: ['length', 'width', 'height', 'lengthUnit', 'weight', 'weightUnit'],
};
