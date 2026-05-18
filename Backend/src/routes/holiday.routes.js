const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllPackages, getPackageById, createPackage, updatePackage, deletePackage } = require('../controllers/holiday.controller');
const { protect } = require('../middlewares/auth.middleware');
// Agent routes (read-only)
router.get('/', protect, getAllPackages);
router.get('/:id', protect, getPackageById);

module.exports = router;
