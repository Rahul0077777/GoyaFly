const express = require('express');
const router = express.Router();
const { setCommissionRule, getCommissionRules } = require('../controllers/commission.controller');
const { protectAdmin } = require('../middlewares/adminAuth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Admin only routes
router.use(protectAdmin, authorizeRoles('SuperAdmin', 'Manager'));
router.post('/', setCommissionRule);
router.get('/', getCommissionRules);

module.exports = router;
