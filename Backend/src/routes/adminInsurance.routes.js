const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createPackage, updatePackage, deletePackage } = require('../controllers/insurance.controller');
const { protectAdmin } = require('../middlewares/adminAuth.middleware');

// Multer config for insurance package images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `insurance_${Date.now()}_${Math.round(Math.random() * 1000)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPG, PNG, and WebP images are allowed!'));
    }
});

router.post('/', protectAdmin, upload.array('images', 5), createPackage);
router.put('/:id', protectAdmin, upload.array('images', 5), updatePackage);
router.delete('/:id', protectAdmin, deletePackage);

module.exports = router;
