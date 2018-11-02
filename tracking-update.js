// This is a work in progress and is not fully implemented.

const persistence = require('./src/service/persistence');
const { Shipment } = require('./src/entities');

// TODO: separate this into a service module
function updateTracking() {
  throw new Error('Not implemented yet');

  // Implementation Plan:

  // Get all active shipments (with a non-finished `status`) from DB
  // For each shipment:
    // Make an async call to UPS for a tracking update
    // If the tracking status has a newer timestamp and the state has changed from the value in the DB:
      // Persist the updated state and tracking timestamp in the DB
      // Make a call to AppDirect via the API Gateway with the shipment ID, tracking ID, and new state
    // Else
      // Do nothing
}

updateTracking();
