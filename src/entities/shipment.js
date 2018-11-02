const _ = require('lodash');
const config = require('config');
const moment = require('moment');
const ShipmentStatusEnum = require('./shipment-status');
const { buildQueryString } = require('../utils/url');

const { trackingBaseUrl } = config.get('integration.ups');

/**
 * Given a tracking ID, construct a URL that can be accessed in the
 * browser so an end user can see the tracking status.
 *
 * @param {String} trackingId
 */
function buildTrackingUrl(trackingId) {
  const queryString = buildQueryString({
    trackNums: trackingId,
    'track.x': 'track',
  });

  return `${trackingBaseUrl}?${queryString}`;
}

/**
 * Map UPS status codes to Shipping Connector shipment states.
 */
const statusMapping = {
  M: ShipmentStatusEnum.UNKNOWN,      // Manifest Pickup Pending
  P: ShipmentStatusEnum.PRE_TRANSIT,  // Picked up
  I: ShipmentStatusEnum.TRANSIT,      // In Transit
  D: ShipmentStatusEnum.DELIVERED,    // Delivered
  X: ShipmentStatusEnum.FAILURE,      // Exception
};

/**
 * Parses a momentJS object out of the UPS date/time struct.
 * UPS provides date/time in "YYYYMMDD" and "HHMMSS", formats in two separate
 * properties.
 *
 * @param {string} dateString
 * @param {string} timeString
 */
function parseUPSDateTime(dateString, timeString) {
  return moment(`${dateString}T${timeString}`, 'YYYYMMDDTHHmmss');
}

class Shipment {
  constructor(sourceObject) {
    Object.assign(this, sourceObject);
  }

  /**
   * Attempt to parse a Shipment from a UPS shipment response.
   *
   * NOTE: This supports UPS parcels only, not UPS freight (which has a whole other set
   * of business rules).
   *
   * @param {Object} upsShipment
   */
  static fromUPSShipment(upsShipment) {
    // Check for a well-formed payload (should contain a Package property).
    // UPS Freight is not supported by this Shipping Connector.
    if (!upsShipment || !upsShipment.Package) {
      throw new Error('Only UPS Parcel tracking is supported.');
    }

    // Extract the queried tracking number for later use
    const requestTrackingNumber = upsShipment.InquiryNumber.Value;

    // Package might be an array (multiple parcels) or a single object - make it an array
    const packageArray = Array.isArray(upsShipment.Package) ? upsShipment.Package : [upsShipment.Package];

    // Find the correct package in the array - either the only package or the one
    // with a matching tracking number (if multiple packages are present)
    const packageData = packageArray.length === 1
      ? packageArray[0]
      : packageArray.find(pkg => pkg.TrackingNumber === requestTrackingNumber);

    if (!packageData) {
      throw new Error('UPS response does not contain a valid parcel or package');
    }

    // Get activity for the found package
    const { TrackingNumber, Activity } = packageData;

    // Activity is an object (if there is one item) or an array - make it an array
    const activityArray = Array.isArray(Activity) ? Activity : [Activity];

    // Get latest activity item by sorting activity by timestamp
    const latestActivity = activityArray
      .map(activityItem => Object.assign(activityItem, { timestamp: parseUPSDateTime(activityItem.Date, activityItem.Time) }))
      .sort((a, b) => a.timestamp.diff(b.timestamp))
      .slice(-1)[0];

    if (!latestActivity) {
      throw new Error('UPS package info does not contain any activity');
    }

    const { Status: { Type, Description } } = latestActivity;
    const trackingUrl = buildTrackingUrl(TrackingNumber);

    return new Shipment({
      shipmentNumber: TrackingNumber,
      trackingNumber: TrackingNumber,
      status: statusMapping[Type] || ShipmentStatusEnum.UNKNOWN,
      statusText: Description,
    });
  }

  /**
   * Loads a Shipment object from the DB.
   * @param {Object} shipmentModel
   */
  static fromShipmentModel(shipmentModel) {
    const shipment = new Shipment(_.pick(shipmentModel, [
      'id',
      'shoppingCartId',
      'status',
      'shipmentNumber',
      'trackingNumber',
    ]));

    // Note: doesn't load full address objects or parcel ids
    shipment.originAddressId = shipmentModel.originAddress;
    shipment.deliveryAddressId = shipmentModel.deliveryAddress;

    return shipment;
  }

  /**
   * Builds a Shipment model suitable for persistence in the DB.
   */
  toShipmentModel() {
    return {
      id: this.id,
      shoppingCartId: this.shoppingCartId,
      status: this.status || ShipmentStatusEnum.UNKNOWN,
      shipmentNumber: this.shipmentNumber,
      trackingNumber: this.trackingNumber,
    };
  }

  /**
   * Generates a ShippingConnectorSpec-compliant response object.
   */
  toResponse() {
    return {
      shipmentId: this.shipmentNumber || this.trackingNumber,
      shipmentTrackingNumber: this.trackingNumber,
      shipmentStatusUrl: buildTrackingUrl(this.trackingNumber),
      shipmentStatus: this.status || ShipmentStatusEnum.UNKNOWN,
      shipmentStatusText: this.statusText,
    };
  }
}

module.exports = Shipment;
