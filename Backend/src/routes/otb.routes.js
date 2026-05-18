const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    createOTBRequest, 
    verifyOTBPayment, 
    getOTBStatus, 
    updateOTBStatus, 
    getAllOTBRequests 
} = require('../controllers/otb.controller');
const { protect } = require('../middlewares/auth.middleware');
const { protectAdmin } = require('../middlewares/adminAuth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `otb_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only images and PDFs allowed!');
        }
    }
});

const cpUpload = upload.fields([
    { name: 'passportCopy', maxCount: 1 },
    { name: 'visaCopy', maxCount: 1 },
    { name: 'onwardTicket', maxCount: 1 },
    { name: 'returnTicket', maxCount: 1 }
]);

// Protected OTB Routes
router.post('/apply', protect, cpUpload, createOTBRequest);
router.post('/verify-payment', protect, verifyOTBPayment);
router.get('/status/:receiptNumber', protect, getOTBStatus);
router.get('/status/:receiptNumber/:contactNo', protect, getOTBStatus);

// Admin Routes
router.put('/admin/update/:id', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), updateOTBStatus);
router.get('/admin/all', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), getAllOTBRequests);

// --- AGENT OTB ACCESS ROUTES ---
const { 
    initiateOTBSubscription, 
    verifyOTBSubscription, 
    getAgentAccessRequests, 
    updateAgentOTBAccess,
    getAgentStatus,
    activateOTBWithWallet,
    getOtbPricing,
    createOtbPricing,
    updateOtbPricing,
    deleteOtbPricing
} = require('../controllers/otb.controller');

router.post('/subscription/initiate', protect, authorizeRoles('agent'), initiateOTBSubscription);
router.post('/subscription/verify', protect, authorizeRoles('agent'), verifyOTBSubscription);
router.post('/subscription/wallet', protect, authorizeRoles('agent'), activateOTBWithWallet);
router.get('/agent-status', protect, authorizeRoles('agent'), getAgentStatus);

router.get('/admin/agent-access-requests', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), getAgentAccessRequests);
router.put('/admin/approve-access/:agentId', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), updateAgentOTBAccess);

// --- PRICING ROUTES ---
router.get('/pricing', protect, getOtbPricing); // Agents can get pricing
router.get('/admin/pricing', protectAdmin, getOtbPricing); // Admins can get pricing
router.post('/admin/pricing', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), createOtbPricing);
router.put('/admin/pricing/:id', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), updateOtbPricing);
router.delete('/admin/pricing/:id', protectAdmin, authorizeRoles('SuperAdmin', 'Manager'), deleteOtbPricing);

module.exports = router;
