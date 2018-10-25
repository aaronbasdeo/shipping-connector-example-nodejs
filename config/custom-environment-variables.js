// This file defines environment variables which map to config values, overriding them if provided.
module.exports = {
  sharedAuthSecret: 'SHARED_AUTH_SECRET',
  integration: {
    ups: {
      baseUrl: 'UPS_BASE_URL',
      accessKey: 'UPS_ACCESS_KEY',
      username: 'UPS_USERNAME',
      password: 'UPS_PASSWORD',

      useNegotiatedRates: 'UPS_NEGOTIATED_RATES_FLAG',
      shipperInfo: {
        name: 'UPS_SHIPPER_NAME',
        shipperNumber: 'UPS_SHIPPER_NUMBER',
        street1: 'UPS_SHIPPER_STREET1',
        street2: 'UPS_SHIPPER_STREET2',
        city: 'UPS_SHIPPER_CITY',
        stateCode: 'UPS_SHIPPER_STATE',
        zip: 'UPS_SHIPPER_POSTALCODE',
        country: 'UPS_SHIPPER_COUNTRY',
      },
    },
  },
};
