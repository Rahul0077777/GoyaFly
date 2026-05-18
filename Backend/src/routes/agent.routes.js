const express = require('express');
const { 
    registerAgent, 
    loginAgent, 
    getDashboardStats, 
    getProfile, 
    updateProfile,
    getEarningsReport,
    getMarkups,
    updateMarkup
} = require('../controllers/agent.controller');
const { 
    getAgentNotifications, 
    markNotificationRead,
    getUnreadCount,
    deleteNotification
} = require('../controllers/notification.controller');
const { 
    createTicket, 
    getAgentTickets, 
    addTicketMessage,
    deleteTicket
} = require('../controllers/ticket.controller');
const { protect } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `kyc_${Date.now()}_${file.fieldname}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 }, // 100KB limit as requested
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG images are allowed!'));
        }
    }
});

const kycUpload = upload.fields([
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'shopDoc', maxCount: 1 }
]);

router.post('/register', kycUpload, registerAgent);
router.post('/resubmit-kyc', protect, kycUpload, registerAgent); // We can reuse registerAgent and fix it to handle updates
router.post('/login', loginAgent);

router.use(protect);
router.get('/dashboard/stats', getDashboardStats);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);


// ... ( Multer config skipped in instruction but must exist )

router.get('/notifications/unread-count', getUnreadCount);
router.get('/notifications', getAgentNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/:id', deleteNotification);

// Ticket routes
router.post('/tickets', createTicket);
router.get('/tickets', getAgentTickets);
router.post('/tickets/:id/message', addTicketMessage);
router.delete('/tickets/:id', deleteTicket);

router.get('/earnings-report', getEarningsReport);
router.get('/markups', getMarkups);
router.put('/markups', updateMarkup);

module.exports = router;
