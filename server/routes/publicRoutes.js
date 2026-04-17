const express = require('express');
const ClientViewController = require('../controllers/clientViewController');
const { validate, schemas } = require('../middlewares/validateMiddleware');

const router = express.Router();

// Public route - no auth required
router.get('/:token', validate(schemas.shareToken), ClientViewController.getPublicMeeting);

module.exports = router;
