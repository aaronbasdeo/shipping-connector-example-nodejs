const persistence = require('./persistence');
const shippingService = require('./shipping');
const appdirectIntegration = require('../integration/appdirect');
const _ = require('lodash');


/**
 * Get all active shipments (with a non-finished `status`) from DB
 * For each shipment:
 * Make an async call to UPS for a tracking update
 * If the tracking status has a newer timestamp and the state has changed from the value in the DB:
 * Persist the updated state and tracking timestamp in the DB
 * Make a call to AppDirect via the API Gateway with the shipment ID, tracking ID, and new state
 * Else
 * Do nothing
 */
function updateTracking() {
    // Get all active shipments (with a non-finished `status`) from DB
    persistence.getUnfinishedShipments().then((shipments) => {

        // for demo / debug purpose only
        shipments.map((shipment) => {
            let value = _.pick(shipment, ['id', 'status', 'shipmentNumber', 'trackingNumber'])
            console.log(JSON.stringify(value, null, 2));
        });

        return getTrackingStatus(shipments).then((statuses) => {
            return updateShipmentStatus(shipments, statuses);
        });
    });
}

/**
 * Retrieve status from UPS per each shipments.
 * @param {*} shipments 
 */
function getTrackingStatus(shipments) {
    return Promise.all(shipments.map((shipment) => {
        return shippingService.getTrackingStatus(shipment.trackingNumber).catch((error) => {

            console.log(`Retrieve shipment event failed: ${shipment.trackingNumber} ${error}`);
            return Promise.resolve(null);
        });
    }));
}

function updateShipmentStatus(shipments, statuses) {
    return Promise.all(statuses.map((status) => {
        // handle no status
        if (_.isEmpty(status)) {
            return Promise.resolve(null);
        } else {
            // find the shipment for the status
            let result = _.filter(shipments, (shipment) => {
                return shipment.trackingNumber === status.shipmentTrackingNumber;
            });

            if (!_.isEmpty(result)) {
                return handleStatusUpdate(result[0], status).catch((error) => {
                    return Promise.resolve(null);
                });
            } else {
                return Promise.resolve(null);
            }
        }
    }));
}

function handleStatusUpdate(shipment, status) {
    let now = new Date();

    if ((_.isNil(shipment.lastTrackingUpdate) || shipment.lastTrackingUpdate < now) && shipment.status !== status.shipmentStatus) {
        shipment.status = status.shipmentStatus;
        shipment.lastTrackingUpdate = now;

        return appdirectIntegration.sendShipmentEvent(shipment).then(() => {
            return persistence.updateShipment(shipment);
        }).catch((error) => {
            console.log(`Handle shipment event failed: ${shipment.trackingNumber} ${error}`);
        });
    } else {
        return Promise.resolve();
    }
}

module.exports = {
    updateTracking
};
