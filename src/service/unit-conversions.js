const convert = require('convert-units');

/**
 * This module provides tools and helpers that allow the Shipping Connector to manage units
 * for package dimensions, etc, and convert to/from different units of measurement.
 *
 * Some remarks about UPS handling of units:
 *
 * - UPS accepts only in/cm (length) and lb/kg (weight). The Shipping Connector spec allows other units
 *   of measurement (g, oz, ft, yd, etc.) so the connector implementation must handle the mapping using
 *   this module.
 *
 * - Certain countries (eg. US) must submit package dimensions in imperial units. Other countries
 *   (eg. CA) may provide units in either system.
 *
 * - UPS rejects requests that mix imperial and metric units (eg. kg/in or lb/cm).
 *
 * - UPS imposes upper limits on package dimensions - exceeding these limits will result in a
 *   rejected response.
 */

// Used to plan unit conversions and map ShippingConnector length units to UPS length units.
const LENGTH_UNIT_MAPPINGS = Object.freeze([
  {
    // Imperial
    shippingConnectorUnits: ['in', 'ft', 'yd'],
    adjustedUnit: 'in',
    upsUnit: 'IN',
  },
  {
    // Metric
    shippingConnectorUnits: ['mm', 'cm', 'm'],
    adjustedUnit: 'cm',
    upsUnit: 'CM',
  },
]);

// Used to plan unit conversions and map ShippingConnector weight units to UPS weight units.
const WEIGHT_UNIT_MAPPINGS = Object.freeze([
  {
    // Imperial
    shippingConnectorUnits: ['oz', 'lb'],
    adjustedUnit: 'lb',
    upsUnit: 'LBS',
  },
  {
    // Metric
    shippingConnectorUnits: ['g', 'kg'],
    adjustedUnit: 'kg',
    upsUnit: 'KGS',
  },
]);

// Shipments originating in these countries must provide package dimensions in imperial units.
// Other countries may provide package dimensions in either imperial or metric units.
const IMPERIAL_UNIT_COUNTRIES = Object.freeze([
  'US',
]);


/**
 * Gets the unit mapping object for length/width/height dimensions. If originCountryCode
 * is provided, this function will return an appropriate unit of measurement that respects
 * the UPS business rules regarding imperial units.
 *
 * @param {*} lengthUnit
 * @param {*} originCountryCode
 */
function getMappingForLengthUnit(lengthUnit, originCountryCode) {
  return IMPERIAL_UNIT_COUNTRIES.includes(originCountryCode)
    ? LENGTH_UNIT_MAPPINGS[0] // Special case for origin countries that require imperial units
    : LENGTH_UNIT_MAPPINGS.find(m => m.shippingConnectorUnits.includes(lengthUnit));
}
/**
 * Gets the unit mapping object for weight. If originCountryCode is provided, this function
 * will return an appropriate unit of measurement that respects the UPS business rules
 * regarding imperial units.
 *
 * @param {*} lengthUnit
 * @param {*} originCountryCode
 */
function getMappingForWeightUnit(weightUnit, originCountryCode) {
  return IMPERIAL_UNIT_COUNTRIES.includes(originCountryCode)
    ? WEIGHT_UNIT_MAPPINGS[0] // Special case for origin countries that require imperial units
    : WEIGHT_UNIT_MAPPINGS.find(mapping => mapping.shippingConnectorUnits.includes(weightUnit));
}

module.exports = {
  convert,
  getMappingForLengthUnit,
  getMappingForWeightUnit,
};
