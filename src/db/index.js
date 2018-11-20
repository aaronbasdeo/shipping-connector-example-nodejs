const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('db');

// Define operator aliases to prevent injection attacks
const operatorsAliases = {
  $eq: Sequelize.Op.eq,
};

// Initialize database instance
const db = new Sequelize(Object.assign({}, dbConfig, { operatorsAliases }));

// ====================================
// MODELS
// ====================================

const Address = db.define('Address', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  company: Sequelize.STRING,
  street1: Sequelize.STRING,
  street2: Sequelize.STRING,
  city: Sequelize.STRING,
  stateCode: Sequelize.STRING,
  zip: Sequelize.STRING,
  country: Sequelize.STRING,
  phone: Sequelize.STRING,
  email: Sequelize.STRING,
}, {
  indexes: [
    { unique: true, fields: ['id'] },
  ],
});

const Shipment = db.define('Shipment', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shoppingCartId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  originAddress: {
    type: Sequelize.INTEGER,
    references: {
      model: Address,
      key: 'id',
    }
  },
  deliveryAddress: {
    type: Sequelize.INTEGER,
    references: {
      model: Address,
      key: 'id',
    }
  },
  appdPartnerId: Sequelize.STRING,
  status: Sequelize.STRING,
  shipmentNumber: Sequelize.STRING, // In UPS, shipmentNumber === trackingNumber
  trackingNumber: Sequelize.STRING,
  lastTrackingUpdate: Sequelize.DATE,
  weightAmount: Sequelize.STRING,
  weightUnits: Sequelize.STRING,
  chargeAmount: Sequelize.STRING,
  chargeCurrency: Sequelize.STRING,
  labelFormat: Sequelize.STRING,
  labelData: Sequelize.BLOB,
}, {
  indexes: [
    { unique: true, fields: ['id'] },
  ],
});

const Parcel = db.define('Parcel', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shipment: {
    type: Sequelize.INTEGER,
    references: {
      model: Shipment,
      key: 'id',
    },
  },
  length: Sequelize.STRING,
  width: Sequelize.STRING,
  height: Sequelize.STRING,
  lengthUnit: Sequelize.STRING,
  weight: Sequelize.STRING,
  weightUnit: Sequelize.STRING,
}, {
  indexes: [
    { unique: true, fields: ['id'] },
    { fields: ['shipment'] },
  ],
});

const SavedRate = db.define('SavedRate', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  shipment: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  carrier: Sequelize.STRING,
  serviceLevel: Sequelize.STRING,
  price: Sequelize.STRING,
  currencyCode: Sequelize.STRING,
}, {
  indexes: [
    { unique: true, fields: ['id'] },
    { unique: true, fields: ['uuid'] }, // Lookups by UUID
  ],
});

/**
 * Tests the connection to the DB, returning true if the connection succeeds. If the connection
 * fails, an error is thrown.
 */
function testConnection() {
  return db.authenticate()
    .then(() => true);
}

/**
 * Syncs the DB structure with the models defined above.
 *
 * If a { force: true } option is provided, existing tables will be DROPped before the new
 * schema is loaded.
 */
function syncModels() {
  return db.sync({ force: true });
}

module.exports = {
  testConnection,
  syncModels,
  models: {
    Address,
    Shipment,
    Parcel,
    SavedRate,
  },
  db,
};
