const express = require('express');
const router = express.Router();
const { getTaxRules, createTaxRule, updateTaxRule, deleteTaxRule } = require('../controllers/tax.controller');
const { protectAdmin } = require('../middlewares/adminAuth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(protectAdmin, authorizeRoles('SuperAdmin', 'Manager'));

router.get('/', getTaxRules);
router.post('/', createTaxRule);
router.put('/:id', updateTaxRule);
router.delete('/:id', deleteTaxRule);

module.exports = router;
