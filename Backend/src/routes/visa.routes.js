const express = require('express');
const router = express.Router();
const { getAllPackages, getPackageById } = require('../controllers/visa.controller');
const { protect } = require('../middlewares/auth.middleware');

// Agent routes (read-only)
router.get('/', protect, getAllPackages);
router.get('/:id', protect, getPackageById);

module.exports = router;
