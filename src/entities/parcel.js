const _ = require('lodash');
const config = require('config');
const { getMappingForLengthUnit, getMappingForWeightUnit, convert } = require('../service/unit-conversions');

const { dimensionPrecision } = config.get('integration.ups');

/**
 * The Parcel class represents a single package with dimensions (length x width x height x weight).
 *
 * This class provides functions to convert UPS
 */
class Parcel {
  constructor(sourceObject) {
    Object.assign(this, sourceObject);
  }

  /**
   * Generates a UPS package payload, taking care of unit conversions.
   *
   * @param {string} options.originCountryCode required in order to set the correct units (metric or imperial)
   */
  toPackage({ originCountryCode }) {
    // UPS supports only inches or cm - take care of conversions from a valid shipping connector unit.
    // Also note that certain origin countries are required to submit package dimensions using
    // imperial units - the US is the main example.

    // Figure out our target length unit and UPS unit
    const {
      adjustedUnit: adjustedLengthUnit,
      upsUnit: upsLengthUnit,
    } = getMappingForLengthUnit(this.lengthUnit, originCountryCode);

    // Convert length dimensions to target unit
    const [adjustedLength, adjustedWidth, adjustedHeight] = [
      this.length, this.width, this.height
    ].map(dimension => convert(dimension).from(this.lengthUnit).to(adjustedLengthUnit));

    // Figure out our target weight unit and UPS unit
    const {
      adjustedUnit: adjustedWeightUnit,
      upsUnit: upsWeightUnit,
    } = getMappingForWeightUnit(this.weightUnit, originCountryCode);

    // Convert weight dimension to target unit
    const adjustedWeight = convert(this.weight).from(this.weightUnit).to(adjustedWeightUnit);

    return {

      Dimensions: {
        UnitOfMeasurement: {
          Code: upsLengthUnit,
          Description: convert().describe(adjustedLengthUnit).plural,
        },
        Length: +adjustedLength.toFixed(dimensionPrecision) + '', // All dimensions must be cast to strings
        Width: +adjustedWidth.toFixed(dimensionPrecision) + '',
        Height: +adjustedHeight.toFixed(dimensionPrecision) + '',
      },
      PackageWeight: {
        UnitOfMeasurement: {
         Code: upsWeightUnit,
         Description: convert().describe(adjustedWeightUnit).plural,
        },
        Weight: +adjustedWeight.toFixed(dimensionPrecision) + '',
      },
    };
  }

  /**
   * Generates a UPS payload with formatting for Quote Requests.
   *
   * @param {string} options.originCountryCode required in order to set the correct units (metric or imperial)
   */
  toUPSQuoteRequestPackage({ originCountryCode } = {}) {
    return Object.assign(this.toPackage({ originCountryCode }), {
      PackagingType: {
        Code: '02',
      },
    })
  }

  /**
   * Generates a UPS payload with formatting for Shipment Requests.
   * @param {string} options.originCountryCode required in order to set the correct units (metric or imperial)
   */
  toUPSShipmentRequestPackage({ originCountryCode } = {}) {
    return Object.assign(this.toPackage({ originCountryCode }), {
      Packaging: {
        Code: '02',
      },
    })
  }

  /**
   * Builds an object that is suitable for DB persistence.
   */
  toParcelModel() {
    return _.pick(this, [
      'id',
      'length',
      'width',
      'height',
      'lengthUnit',
      'weight',
      'weightUnit',
    ]);
  }

  /**
   * Builds a Parcel object from a DB model.
   * @param {Object} parcelModel
   */
  static fromParcelModel(parcelModel) {
    return new Parcel({
      id: parcelModel.id,
      length: Number(parcelModel.length),
      width: Number(parcelModel.width),
      height: Number(parcelModel.height),
      lengthUnit: parcelModel.lengthUnit,
      weight: Number(parcelModel.weight),
      weightUnit: parcelModel.weightUnit,
    });
  }
}

module.exports = Parcel;
