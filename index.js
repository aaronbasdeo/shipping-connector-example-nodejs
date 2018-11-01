const app = require('./src/server');
const config = require('config');

const port = config.get('port');

const { testConnection, syncModels } = require('./src/db');

// Connect to DB and sync before running the server
testConnection()
.then(syncModels)
.then(() => console.log('Successfully connected to database'))
.then(() => {
  app.listen(port, () => console.log(`Connector listening on port ${port}!`));
});
