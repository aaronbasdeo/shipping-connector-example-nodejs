/**
 * Takes an object containing key-value pairs and maps it to a query string.
 *
 * @param {Object} queryParamsObject
 */
function buildQueryString(queryParamsObject) {
  return Object.entries(queryParamsObject)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

module.exports = {
  buildQueryString,
};
