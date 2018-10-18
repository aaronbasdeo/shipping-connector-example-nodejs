const app = require('./src/server');
const config = require('config');

const port = config.get('port');

app.listen(port, () => console.log(`Connector listening on port ${port}!`));
