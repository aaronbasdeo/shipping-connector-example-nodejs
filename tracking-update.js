const trackingService = require('./src/service/tracking');
const { testConnection } = require('./src/db');

testConnection()
  .then(() => {
    console.log('Successfully connected to database');
    trackingService.updateTracking();
  });