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

      // Access Key (requested via https://www.ups.com/upsdeveloperkit)
      // This is required in addition to the MyUPS username and password in every request
      // except for the Tracking Status API
      accessKey: '',

      // Base URL for browser-based tracking tool
      trackingBaseUrl: 'https://wwwapps.ups.com/WebTracking/track',
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
