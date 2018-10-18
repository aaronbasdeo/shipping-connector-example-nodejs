const express = require('express');
const router = express.Router();

/* GET / */
router.get('/', (req, res, next) => res.redirect('/status'));

/* GET status */
router.get('/status', (req, res, next) => res.status(200).send('OK'));

/* GET favicon */
router.get('/favicon.ico', (req, res, next) => res.status(204));

module.exports = router;
