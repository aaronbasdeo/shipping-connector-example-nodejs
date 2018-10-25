/**
 * Default configuration for the shipping connector. This file will be overriden
 * by environment-specific configs, eg. /config/production.js.
 */
module.exports = {
  /**
   * The connector will listen for HTTP requests on this port.
   */
  port: 3000,

  /**
   * A pre-defined secret token that will be used to authenticate
   * incoming API requests from AppDirect. Simply compare the incoming
   * bearer token with the shared auth secret and accept the request
   * if the token matches the value defined here.
   *
   * Do not expose secrets in code or config files. Instead, set the
   * SHARED_AUTH_SECRET environment variable and this connector will
   * use it automatically.
   */
  sharedAuthSecret: '',

  integration: {
    ups: {
      // Customer Integration Environment base URL
      baseUrl: 'https://wwwcie.ups.com/rest',

      // The UPS API requires username and password in every request
      username: '',
      password: '',

      // Access is required in addition to the MyUPS username and password in every request
      // Access keys can be requested via https://www.ups.com/upsdeveloperkit
      accessKey: '',

      // Base URL for building tracking links
      trackingBaseUrl: 'https://wwwapps.ups.com/WebTracking/track',

      // If true, the connector will attempt to get negotiated rates when requesting shipping quotes
      useNegotiatedRates: false,

      // When getting rates and creating shipments, use this info for the shipper
      shipperInfo: {
        name: 'AppDirect', // Individual or company name
        shipperNumber: '12345',
        street1: '650 California Street',
        street2: 'FL25',
        city: 'San Francisco',
        stateCode: 'CA',
        zip: '94108',
        country: 'US',
      },
    },

    appdirect: {
      // Channel configurations
      channels: [
        {
          baseUrl: 'https://testmarketplace.appdirect.com',
          partner: 'APPDIRECT',
          credentials: {
            key: '',
            secret: '',
          },
        },
      ],
    },
  },
};
