const express = require('express');
const router = express.Router();
const { loginAdmin, approveAgentKyc, getAllAgents, getStats, deleteAgent, updateAgent, createAgent, createPromotion, getPromotions, updatePromotion, deletePromotion, getSubAgents, getSubAgentStats, getAnalytics, getAllOtbRequests, getOtbAgentRequests, updateOtbStatus, approveOtbAgentAccess, adjustAgentWallet, toggleBlockAgent, getAllRefunds, processManualRefund } = require('../controllers/admin.controller');
const { getSettings, updateSettings } = require('../controllers/setting.controller');
const { getAllBookings, updateBookingStatus } = require('../controllers/booking.controller');
const { getCommissionRules, setCommissionRule } = require('../controllers/commission.controller');
const { adminGetAllTickets, adminReplyTicket } = require('../controllers/ticket.controller');
const { getMarkupRules, setMarkupRule, deleteMarkupRule } = require('../controllers/markup.controller');

// Correct Middlewares
const { protectAdmin } = require('../middlewares/adminAuth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Public Login
router.post('/login', loginAdmin);

// All routes below require Admin authentication and high-privilege roles
router.use(protectAdmin, authorizeRoles('SuperAdmin', 'Manager'));

// Agent Management
router.post('/agents', createAgent);
router.get('/agents', getAllAgents);
router.put('/agents/:id/approve', approveAgentKyc);
router.patch('/agents/:id/toggle-block', toggleBlockAgent);
router.delete('/agents/:id', deleteAgent);
router.put('/agents/:id', upload.single('logo'), updateAgent);
router.post('/agents/adjust-wallet', adjustAgentWallet);

// Promotions
router.get('/promotions', getPromotions);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

// Sub-Agents
router.get('/sub-agents', getSubAgents);
router.get('/sub-agents/stats', getSubAgentStats);

// Stats & Analytics
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

// OTB Management
router.get('/otb/requests', getAllOtbRequests);
router.get('/otb/agent-requests', getOtbAgentRequests);
router.put('/otb/requests/:id', updateOtbStatus);
router.put('/otb/agents/:id/otb-access', approveOtbAgentAccess);

// Bookings
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// Commission Rules
router.get('/commissions', getCommissionRules);
router.post('/commissions', setCommissionRule);

// Markup Rules
router.get('/markups', getMarkupRules);
router.post('/markups', setMarkupRule);
router.delete('/markups/:id', deleteMarkupRule);

// Ticket Management
router.get('/tickets', adminGetAllTickets);
router.post('/tickets/:id/reply', adminReplyTicket);

// Global Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Refunds Management
router.get('/refunds', getAllRefunds);
router.post('/refunds/:bookingId/process', processManualRefund);

// Reschedule Management
const { getAllReschedules, provideRescheduleQuote, processReschedule } = require('../controllers/admin.controller');
router.get('/reschedules', getAllReschedules);
router.post('/reschedules/:id/quote', provideRescheduleQuote);
router.post('/reschedules/:id/process', processReschedule);

module.exports = router;
