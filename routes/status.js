const express = require('express');
const { body } = require('express-validator');

const statusController = require('../controllers/status');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put('', isAuth, [
    body('status').trim().notEmpty()
], statusController.putStatus);

router.get('', isAuth, statusController.getStatus);

module.exports = router;