const express = require('express');
const router = express.Router();
const { createCoupon, validateCoupon, getAllCoupons, updateCoupon, deleteCoupon } = require('../controllers/coupon.controller');
const { protect } = require('../middlewares/auth.middleware');
const { protectAdmin } = require('../middlewares/adminAuth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Public/Agent route to check a coupon at checkout
router.post('/validate', protect, validateCoupon);

// Admin only routes
router.use('/admin-rules', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'));
router.post('/create', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), createCoupon);
router.get('/', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), getAllCoupons);
router.put('/:id', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), updateCoupon);
router.delete('/:id', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), deleteCoupon);

module.exports = router;
