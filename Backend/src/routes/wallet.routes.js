const express = require('express');
const router = express.Router();
const { createOrder, rechargeWallet, getWalletHistory, getBalance, getWalletStats } = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Lock down all wallet routes securely
router.post('/recharge', rechargeWallet); // Handled by standard auth now
router.post('/create-order', createOrder);
router.get('/history', getWalletHistory); // Removed /:agentId because we get it securely from req.user._id now!
router.get('/balance', getBalance);
router.get('/stats', getWalletStats);

module.exports = router;
