const express = require('express');
const router = express.Router();
const { getPromotions } = require('../controllers/admin.controller');

// Public route to get active promotions for the homepage
router.get('/promotions', getPromotions);

module.exports = router;
