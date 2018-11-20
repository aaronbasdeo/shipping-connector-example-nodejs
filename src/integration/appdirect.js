const config = require('config');
const request = require('request-promise-native');
const randomstring = require('randomstring');

const { channels } = config.get('integration.appdirect');
const REQUEST_ID_LENGTH = 16;

/**
 * 
 * @param {string} partner A partner id
 * @returns {Object} A channel config  
 */
function getChannelConfiguration(partner) {
  return channels.find(channel => channel.partner === partner);
}

/**
 * Sending AppDirect shipment status event.
 * 
 * @param {Object} A shipment object
 * @returns {Promise}
 */
function sendShipmentEvent({ appdPartnerId, shipmentNumber, trackingNumber }) {
  return generateNewAccessToken(appdPartnerId).then(({ access_token: accessToken }) => {
    const eventId = randomstring.generate({ length: REQUEST_ID_LENGTH });
    let { baseUrl } = channels.find(channel => channel.partner === appdPartnerId);

    console.log(`Sending event, EventId: ${eventId}, Partner: ${appdPartnerId}, Tracking Number: ${trackingNumber}`);

    const options = {
      uri: `${baseUrl}/api/appMarket/v2/shipments/${shipmentNumber}/event`,
      headers: {
        'authorization': `bearer ${accessToken}`
      },
      body: {
        eventId: eventId,
        carrier: 'usps',
        trackingNumber,
        action: 'UPDATE'
      },
      json: true
    };
    return request.post(options);
  });
}

/**
 * Sending AppDirect to request an OAuth2 access token.
 * @param {string} appdPartnerId AppDriect partner Id
 * @returns {Promise} 
 */
function generateNewAccessToken(appdPartnerId) {
  let { baseUrl, credentials: { key, secret } } = channels.find(channel => channel.partner === appdPartnerId);
  let apiCredentials = (new Buffer(`${key}:${secret}`)).toString('base64');

  const options = {
    uri: `${baseUrl}/oauth2/token`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'authorization': `Basic ${apiCredentials}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };
  return request.post(options);
}

module.exports = {
  getChannelConfiguration,
  sendShipmentEvent
};
