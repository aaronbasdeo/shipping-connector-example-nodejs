const createError = require('http-errors');
const persistence = require('./persistence');
const { parseUPSAddressValidationResponse, parseUPSRatesResponse, parseUPSShipmentRequestResponse } = require('./response-parsing');
const upsIntegration = require('../integration/ups');
const { ShippingAddress, Shipment, QuoteRequest, ShipmentRequest, Rate, Parcel } = require('../entities');

// Countries which can have addresses validated by UPS
const SUPPORTED_ADDRESS_VALIDATION_COUNTRIES = ['US'];

/**
 * Validates a shipping address with UPS.
 *
 * Some local validation is performed to ensure that the address object
 * is well-formed according to the Shipping Connector spec.
 *
 * It also enforces business constraints such as limiting the address
 * validation to US addresses (due to UPS limitations).
 *
 * Finally, it makes the API call to UPS and parses the response to determine
 * if the address is valid or not. UPS normalizes the addresses using the USPS
 * database instead of validating individual address fields. This means that
 * an address is considered "invalid" by UPS if it does not match any address.
 *
 * Another case is where the address is ambiguous, matching 2 + addresses
 * in the USPS database. In the current Shipping Connector spec, this is an
 * invalid address. Candidate addresses are returned in the response context
 * to assist with debugging for now.
 *
 * A successful validation results in the candidate address being returned.
 *
 * @param {Object} rawAddress
 */
function validateShippingAddress(rawAddress) {
  const address = new ShippingAddress(rawAddress);

  // Check for malformed payload (missing props, wrong types, etc)
  const validationErrors = address.validate();
  if (validationErrors) {
    throw createError(422, 'Invalid address', {
      errorCode: 'invalid.address',
      errorDetail: {
        message: 'address.is.malformed',
        detail: validationErrors,
      },
    });
  }

  // Business constraint: UPS only supports address validation on US addresses.
  // If the provided address is not US, return 501 NOT IMPLEMENTED.
  if (!SUPPORTED_ADDRESS_VALIDATION_COUNTRIES.includes(address.country)) {
    throw createError(501, 'Unsupported country', {
      errorCode: 'unsupported.country',
      errorDetail: 'country.cannot.be.validated.by.ups',
    });
  }

  return upsIntegration.sendAddressValidationRequest(address.toUPSValidationAddress())
    .then((responseBody) => parseUPSAddressValidationResponse(responseBody, address));
}

/**
 * Given a quote request (shipper, shipFrom, shipTo, parcels), gets a list of rates
 * from UPS.
 *
 * It handles some of the business rules and behaviors of UPS, such as:
 * - Shipments that originate in the US must have parcel dimensions specified in
 *   imperial units (shipments from other countries can use metric or imperial).
 * - Unit conversions between Shipping Connector units (ft, yd, m, mm, oz, g) to
 *   UPS-accepted units (in, cm, lb, kg).
 *
 * A Quote Request will persist details of the request as a Shipment in the database
 * along with saved addresses and parcels. This allows the quote details to be recalled
 * when a shipment request is made.
 *
 * @param {Object} rawQuoteRequest
 */
async function getQuotes(rawQuoteRequest) {
  const quoteRequest = new QuoteRequest(rawQuoteRequest);

  // Check whether the raw quote request is well-formed
  const validationResult = quoteRequest.validate();

  if (!validationResult.valid) {
    throw createError(400, 'Quote request body is invalid', {
      context: { errors: validationResult.errors }
    });
  }

  // Fetch rates from UPS
  const rates = await upsIntegration.sendQuotesRequest(quoteRequest.toUPSQuoteRequest())
    .then(parseUPSRatesResponse);

  // Persist the shipment & addresses, obtaining the shipment ID
  const shipmentModel = quoteRequest.toShipmentModel();
  const { shipmentId } = await persistence.createShipment(shipmentModel)
    .then((result) => ({ shipmentId: result.id }));

  // Persist the shipment parcels
  const parcelModels = shipmentModel.parcelModels;
  const parcelResults = await Promise.all(parcelModels.map((parcelModel) => {
    return persistence.createParcel(parcelModel, shipmentId);
  }));

  // Persist the saved rates
  const rateResults = await Promise.all(rates.map((rate) => {
    const rateModel = rate.toSavedRateModel();
    return persistence.createSavedRate(rateModel, shipmentId)
      .then(rateResponse => Object.assign(rate, { uuid: rateResponse.uuid }));
  }));

  return rateResults.map(r => r.toResponse());
}

/**
 * Given a rate UUID, create a Shipment using the addresses and parcels from the original
 * quote request.
 *
 * This function throws errors in the following conditions:
 * - Invalid request body (400)
 * - Rate UUID doesn't exist (404)
 * - Invalid API responses from UPS (400 or 502)
 * - Rate UUID has been used to create a shipment already (409)
 *
 * Results of a successful shipment request are persisted to the DB.
 *
 * @param {*} rawShipmentRequest
 */
async function createShipment(rawShipmentRequest) {
  const shipmentRequest = new ShipmentRequest(rawShipmentRequest);
  const { shoppingCartId, rateId } = shipmentRequest;

  // Check whether the shipment request is well-formed
  const validationResult = shipmentRequest.validate();

  if (!validationResult.valid) {
    throw createError(400, 'Shipment request body is invalid', {
      context: { errors: validationResult.errors }
    });
  }

  // Fetch the SavedRate for the provided rateId
  const savedRateModel = await persistence.getSavedRateByUuid(shipmentRequest.rateId);
  if (!savedRateModel) {
    throw createError(404, `No rate found for rateId ${rateId}`);
  }
  const rate = Rate.fromSavedRateModel(savedRateModel);

  const shipmentId = rate.shipment;
  const shipmentModel = await persistence.getShipmentById(shipmentId);
  const shipment = Shipment.fromShipmentModel(shipmentModel);

  // Ensure that shoppingCartId matches the one from the quote
  if (shipment.shoppingCartId !== shoppingCartId) {
    throw createError(412, `Provided shoppingCartId [${shoppingCartId}] does not match the saved value [${shipment.shoppingCartId}]`);
  }

  // Ensure that a shipment hasn't already been created with this rate
  // If the shipment already has a tracking number, reject the request
  if (!!shipment.trackingNumber) {
    throw createError(409, `A shipment [${shipment.trackingNumber}] already exists for this rate code.`);
  }

  // Fetch origin and delivery addresses for the shipment
  const [originAddress, deliveryAddress] = await Promise.all(
    [shipment.originAddressId, shipment.deliveryAddressId].map(persistence.getAddressById)
  ).then(results => results.map(ShippingAddress.fromAddressModel));

  shipmentRequest.rate = rate;
  shipmentRequest.shipment = shipment;
  shipmentRequest.originAddress = originAddress;
  shipmentRequest.deliveryAddress = deliveryAddress;

    // Fetch all parcels for the shipment
  shipmentRequest.parcels = await persistence.getParcelsByShipmentId(shipmentId)
    .then(parcels => parcels.map(Parcel.fromParcelModel));

  // Make UPS request
  const shipmentResponse = await upsIntegration.sendShipmentRequest(shipmentRequest.toUPSShipmentRequest())
    .then(parseUPSShipmentRequestResponse);

  // Merge the response details into the Shipment object
  Object.assign(shipment, shipmentResponse);

  // Persist the changes to DB
  await persistence.updateShipment(shipment.toShipmentModel());

  return shipment.toResponse();
}

/**
 * Gets the status of a UPS shipment by tracking ID. Given a valid tracking ID,
 * fetches the latest tracking status for the parcel referenced by the tracking ID.
 *
 * If multiple packages are included in a shipment, the Shipping Connector will
 * pick out the package that corresponds to the tracking ID. Each package has its own
 * tracking ID and getting the status of any of these IDs will return the same shipment
 * with multiple packages.
 *
 * At this time, only UPS Parcels are supported by this tracking API. UPS Freight is
 * not supported.
 *
 * A successful request will return a Shipment object, which contains
 * the tracking ID, shipment ID (same as the tracking ID), status URL, status code,
 * and status text.
 *
 * Note that the results of this call are not persisted to the DB.
 *
 * @param {String} trackingId
 */
function getTrackingStatus(trackingId) {
  return upsIntegration.sendTrackingRequest(trackingId)
    .then((responseBody) => {
      try {
        return Shipment.fromUPSShipment(responseBody.TrackResponse.Shipment).toResponse();
      } catch (err) {
        throw createError(502, 'UPS returned an invalid TrackingStatus response', {
          context: { cause: err.message },
        });
      }
    });
}

module.exports = {
  validateShippingAddress,
  getQuotes,
  createShipment,
  getTrackingStatus,
};
