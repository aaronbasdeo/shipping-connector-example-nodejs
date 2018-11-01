const {
  models: {
    Address,
    Shipment,
    Parcel,
    SavedRate,
  },
} = require('../db');

/**
 * Inserts an Address into the database, returning the persisted object.
 *
 * @param {Object} addressModel
 */
function createAddress(addressModel) {
  return Address.create(addressModel)
    .then(result => result.get({ plain: true }));
}

/**
 * Inserts a Shipment into the database. As part of the persistence step,
 * this function will insert two Addresses corresponding to originAddress
 * and deliveryAddress.
 *
 * @param {*} shipmentModel
 */
function createShipment(shipmentModel) {
  const { originAddressModel, deliveryAddressModel } = shipmentModel;

  // First, create the two Addresses
  return Promise.all([originAddressModel, deliveryAddressModel].map(createAddress))
    .then(([originAddressModel, deliveryAddressModel]) => {
      // Create the Shipment, associating it to the two Addresses
      return Shipment.create(Object.assign(shipmentModel, {
        originAddress: originAddressModel.id,
        deliveryAddress: deliveryAddressModel.id,
      }));
    })
    .then(result => result.get({ plain: true }));
}

/**
 * Inserts a Parcel into the database, returning the persisted object.
 *
 * @param {Object} parcelModel
 * @param {string} shipmentId
 */
function createParcel(parcelModel, shipmentId) {
  return Parcel.create(Object.assign(parcelModel, { shipment: shipmentId }))
    .then(result => result.get({ plain: true }));
}

/**
 * Inserts a SavedRate into the database, returning the persisted object.
 *
 * @param {Object} rateModel
 * @param {string} shipmentId
 */
function createSavedRate(rateModel, shipmentId) {
  return SavedRate.create(Object.assign(rateModel, { shipment: shipmentId }))
    .then(result => result.get({ plain: true }));
}

module.exports = {
  createAddress,
  createShipment,
  createParcel,
  createSavedRate,
};
