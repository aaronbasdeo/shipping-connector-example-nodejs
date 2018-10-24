// This file defines environment variables which map to config values, overriding them if provided.
module.exports = {
  sharedAuthSecret: 'SHARED_AUTH_SECRET',
  integration: {
    ups: {
      baseUrl: 'UPS_BASE_URL',
      accessKey: 'UPS_ACCESS_KEY',
      username: 'UPS_USERNAME',
      password: 'UPS_PASSWORD',
    }
  }
};
