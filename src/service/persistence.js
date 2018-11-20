const {
  models: {
    Address,
    Shipment,
    Parcel,
    SavedRate,
  },
} = require('../db');

function getPlainObject(result) {
  return !!result ? result.get({ plain: true }) : null;
}

/**
 * Inserts an Address into the database, returning the persisted object.
 *
 * @param {Object} addressModel
 */
function createAddress(addressModel) {
  return Address.create(addressModel)
    .then(getPlainObject);
}

/**
 * Inserts a Shipment into the database. As part of the persistence step,
 * this function will insert two Addresses corresponding to originAddress
 * and deliveryAddress.
 *
 * @param {*} shipmentModel
 * @param {string} appdPartnerId
 */
function createShipment(shipmentModel, appdPartnerId) {
  const { originAddressModel, deliveryAddressModel } = shipmentModel;

  // First, create the two Addresses
  return Promise.all([originAddressModel, deliveryAddressModel].map(createAddress))
    .then(([originAddressModel, deliveryAddressModel]) => {
      // Create the Shipment, associating it to the two Addresses
      return Shipment.create(Object.assign(shipmentModel, {
        originAddress: originAddressModel.id,
        deliveryAddress: deliveryAddressModel.id,
        appdPartnerId: appdPartnerId
      }));
    })
    .then(getPlainObject);
}

/**
 * Inserts a Parcel into the database, returning the persisted object.
 *
 * @param {Object} parcelModel
 * @param {int} shipmentId
 */
function createParcel(parcelModel, shipmentId) {
  return Parcel.create(Object.assign(parcelModel, { shipment: shipmentId }))
    .then(getPlainObject);
}

/**
 * Inserts a SavedRate into the database, returning the persisted object.
 *
 * @param {Object} rateModel
 * @param {int} shipmentId
 */
function createSavedRate(rateModel, shipmentId) {
  return SavedRate.create(Object.assign(rateModel, { shipment: shipmentId }))
    .then(getPlainObject);
}

/**
 * Gets a SavedRate from the database by UUID.
 *
 * @param {string} uuid
 */
function getSavedRateByUuid(uuid) {
  return SavedRate.findOne({ where: { uuid } })
    .then(getPlainObject);
}

/**
 * Gets a Shipment by numeric shipment ID.
 *
 * @param {int} shipmentId
 */
function getShipmentById(shipmentId) {
  return Shipment.findById(shipmentId)
    .then(getPlainObject);
}

/**
 * Gets all unfinished Shipments.
 *
 */
function getUnfinishedShipments() {
  return Shipment.findAll({
    where: { status: ['UNKNOWN', 'TRANSIT', 'PRE_TRANSIT'] }
  }).then(shipments => shipments.map(getPlainObject));
}

/**
 * Gets an array of Parcels by numeric shipment ID.
 *
 * @param {string} shipmentId
 */
function getParcelsByShipmentId(shipmentId) {
  return Parcel.findAll({ where: { shipment: shipmentId }})
    .then(parcels => parcels.map(getPlainObject));
}

/**
 * Gets an Address by its numeric ID.
 *
 * @param {int} addressId
 */
function getAddressById(addressId) {
  return Address.findById(addressId)
    .then(getPlainObject);
}

/**
 * Updates an existing Shipment.
 *
 * @param {Object} shipmentModel
 */
function updateShipment(shipmentModel) {
  const { id } = shipmentModel;
  return Shipment.update(shipmentModel, { where: { id } })
    .then(([affectedCount, affectedRows]) => ({ affectedCount, affectedRows }));
}

module.exports = {
  createAddress,
  createShipment,
  createParcel,
  createSavedRate,
  getSavedRateByUuid,
  getShipmentById,
  getParcelsByShipmentId,
  getAddressById,
  updateShipment,
  getUnfinishedShipments
};
