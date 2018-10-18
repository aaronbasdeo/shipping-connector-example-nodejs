const config = require('config');

const { channels } = config.get('integration.appdirect');

function getChannelConfiguration(partner) {
  return channels.find(channel => channel.partner === partner);
}

module.exports = {
  getChannelConfiguration,
};
