/**
 * Enumeration of shipment status values expected by the Shipping Connector.
 */
const shipmentStatusEnum = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  PRE_TRANSIT: 'PRE_TRANSIT',
  TRANSIT: 'TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  FAILURE: 'FAILURE',
});

module.exports = shipmentStatusEnum;
