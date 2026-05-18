const OTBRequest = require('../Models/OTBRequest.model');
const OtbPricing = require('../Models/OtbPricing.model');
const { createRazorpayOrder, verifySignature } = require('../services/paymentService');
const { 
    sendOTBStatusUpdate, 
    sendOTBAccessNotification, 
    sendOTBConfirmation,
    createAgentNotification 
} = require('../services/notificationService');
const Agent = require('../Models/Agent.model');
const Transaction = require('../Models/Transaction.model');
const logger = require('../utils/logger');

// AIRLINE_GROUPS removed, using dynamic OtbPricing model

const DESTINATIONS = {
    'Dubai': 0,
    'Sharjah': 0,
    'Abu Dhabi': 0,
    'Kuwait': 250,
    'Bahrain': 250,
    'Oman': 250,
    'Qatar': 250,
    'Saudi Arabia': 250
};

const URGENT_FEES = 300;
const GST_RATE = 0.18;

// Helper to generate Receipt Number: ZAYA-OTB-XXXX
const generateReceiptNumber = async () => {
    const count = await OTBRequest.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `ZAYA-OTB-${sequence}`;
};

// Recalculate OTB fee on backend to prevent manipulation
const recalculateOTBFeeAsync = async (airline, destination, totalPax, isUrgent) => {
    let baseRate = 650; // default fallback
    const pricing = await OtbPricing.findOne({ airline, isActive: true });
    if (pricing) {
        baseRate = pricing.rate;
    }

    const regionalSurcharge = DESTINATIONS[destination] || 0;
    const urgentSurcharge = isUrgent ? URGENT_FEES : 0;

    const subtotal = (baseRate + regionalSurcharge + urgentSurcharge) * totalPax;
    const igst = subtotal * GST_RATE;
    const totalFare = subtotal + igst;

    return {
        airlineFee: baseRate * totalPax,
        surcharge: regionalSurcharge * totalPax,
        urgentSurcharge: urgentSurcharge * totalPax,
        igst: parseFloat(igst.toFixed(2)),
        totalFare: parseFloat(totalFare.toFixed(2))
    };
};

// @desc    Create new OTB request and generate Razorpay order
// @route   POST /api/otb/apply
// @access  Agent
const createOTBRequest = async (req, res) => {
    try {
        // Enforce agent-only check as this service is now agent-exclusive
        if (!req.user || req.user.role !== 'agent') {
            return res.status(403).json({ 
                success: false, 
                message: 'This service is exclusive to registered agents. Please log in as an agent to continue.' 
            });
        }

        // Check if agent has approved OTB access
        const agent = await Agent.findById(req.user._id);
        if (!agent || agent.otbAccessStatus !== 'APPROVED') {
            return res.status(403).json({ 
                success: false, 
                message: 'Your OTB lifetime access is not activated. Please go to the OTB section to pay the one-time fee.' 
            });
        }

        let {
            airline,
            noOfAdults,
            noOfChildren,
            noOfInfants,
            travelDetails,
            passengers,
            fees
        } = req.body;

        // When using multipart/form-data (for file uploads), 
        // nested objects/arrays might arrive as JSON strings.
        if (typeof travelDetails === 'string') travelDetails = JSON.parse(travelDetails);
        if (typeof passengers === 'string') passengers = JSON.parse(passengers);
        if (typeof fees === 'string') fees = JSON.parse(fees);

        const isUrgent = req.body.isUrgent === true || req.body.isUrgent === 'true';

        // Recalculate amount to verify
        const totalPax = parseInt(noOfAdults || 0) + parseInt(noOfChildren || 0) + parseInt(noOfInfants || 0);
        const verifiedFees = await recalculateOTBFeeAsync(airline, travelDetails?.destination, totalPax, isUrgent);
        
        // Log discrepancy but use verified amount
        if (Math.abs(verifiedFees.totalFare - fees.totalFare) > 1) {
             logger.warn(`Price discrepancy in OTB apply: Client sent ${fees.totalFare}, Server calculated ${verifiedFees.totalFare}`);
        }

        // Validation
        if (!airline || !travelDetails || !passengers || !fees) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const receiptNumber = await generateReceiptNumber();

        // Handle file uploads if they exist (multer will populate req.files)
        const documents = {};
        if (req.files) {
            if (req.files.passportCopy) documents.passportCopy = `/uploads/${req.files.passportCopy[0].filename}`;
            if (req.files.visaCopy) documents.visaCopy = `/uploads/${req.files.visaCopy[0].filename}`;
            if (req.files.onwardTicket) documents.onwardTicket = `/uploads/${req.files.onwardTicket[0].filename}`;
            if (req.files.returnTicket) documents.returnTicket = `/uploads/${req.files.returnTicket[0].filename}`;
        }


        // 4. Wallet Balance Check & Deduction
        if (agent.walletBalance < verifiedFees.totalFare) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient wallet balance. Fee: ₹${verifiedFees.totalFare}, Balance: ₹${agent.walletBalance}` 
            });
        }

        // 5. Create the OTB Request record (Pre-paid via Wallet)
        const otbRequest = await OTBRequest.create({
            agentId: agent._id,
            airline,
            noOfAdults,
            noOfChildren,
            noOfInfants,
            travelDetails,
            passengers,
            documents,
            fees: verifiedFees,
            receiptNumber,
            status: 'PENDING',
            paymentStatus: 'PAID', // Atomic wallet deduction
            paymentMethod: 'WALLET',
            isUrgent
        });

        // 6. Deduct from Wallet
        agent.walletBalance -= verifiedFees.totalFare;
        await agent.save();

        // 7. Log Transaction
        await Transaction.create({
            agentId: agent._id,
            transactionType: 'DEBIT',
            purpose: 'OTB_APPLICATION',
            amount: verifiedFees.totalFare,
            balanceAfterTransaction: agent.walletBalance,
            referenceId: otbRequest._id,
            status: 'SUCCESS',
            paymentMethod: 'WALLET'
        });

        // 8. Notify Admin/Agent (Optional: already handles in verify step previously, but here it's immediate)
        try {
            await createAgentNotification(agent._id, 'OTB Application Submitted', `Your OTB request for ${airline} (${receiptNumber}) has been received and paid via wallet.`);
        } catch (e) { logger.error('OTB Notification Error:', e); }

        res.status(201).json({
            success: true,
            message: 'Application submitted and paid via wallet balance',
            otbRequest,
            receiptNumber
        });

    } catch (error) {
        console.error('Create OTB Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// @desc    Verify OTB payment
// @route   POST /api/otb/verify-payment
// @access  Public
const verifyOTBPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        const otbRequest = await OTBRequest.findOne({ razorpayOrderId: razorpay_order_id });

        if (!otbRequest) {
            return res.status(404).json({ success: false, message: 'OTB Request not found' });
        }

        otbRequest.paymentStatus = 'PAID';
        otbRequest.razorpayPaymentId = razorpay_payment_id;
        await otbRequest.save();

        // Fetch Agent details for the confirmation email
        const agent = await Agent.findById(otbRequest.agentId);
        if (agent) {
            await sendOTBConfirmation(otbRequest, agent);
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and request submitted',
            receiptNumber: otbRequest.receiptNumber
        });

    } catch (error) {
        console.error('Verify OTB Payment Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get OTB Status
// @route   GET /api/otb/status/:receiptNumber/:contactNo
// @access  Public
const getOTBStatus = async (req, res) => {
    try {
        const receiptNumber = req.params.receiptNumber?.trim().toUpperCase();
        const contactNo = req.params.contactNo?.trim();
        
        const query = { receiptNumber };
        if (contactNo) {
            query['travelDetails.contactNo'] = contactNo;
        }

        const otbRequest = await OTBRequest.findOne(query);

        if (!otbRequest) {
            return res.status(404).json({ success: false, message: 'Request not found with given details' });
        }

        res.status(200).json({
            success: true,
            status: otbRequest.status,
            otbRequest
        });

    } catch (error) {
        console.error('Get OTB Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Admin: Update OTB Status
// @route   PUT /api/admin/otb/:id
// @access  Admin/Manager
const updateOTBStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const otbRequest = await OTBRequest.findByIdAndUpdate(
            req.params.id,
            { status, adminNotes },
            { new: true }
        );

        if (!otbRequest) {
            return res.status(404).json({ success: false, message: 'OTB Request not found' });
        }

        // Send Email/SMS notification to customer
        await sendOTBStatusUpdate(otbRequest);
        
        // --- NEW: Trigger In-App Notification for Agent ---
        if (otbRequest.agentId) {
            await createAgentNotification({
                agentId: otbRequest.agentId,
                title: `OTB Status Updated: ${status}`,
                message: `The status of application ${otbRequest.receiptNumber} (${otbRequest.airline}) has been changed to ${status}. ${adminNotes ? 'Remarks: ' + adminNotes : ''}`,
                type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ALERT' : 'INFO',
                link: '/agent/otb' 
            });
        }
        
        logger.info(`OTB Request ${otbRequest.receiptNumber} updated to ${status}`);

        res.status(200).json({
            success: true,
            otbRequest
        });

    } catch (error) {
        console.error('Update OTB Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Admin: Get all OTB Requests
// @route   GET /api/admin/otb
// @access  Admin/Manager
const getAllOTBRequests = async (req, res) => {
    try {
        const requests = await OTBRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get Current Agent OTB Status
// @route   GET /api/otb/agent-status
// @access  Agent
const getAgentStatus = async (req, res) => {
    try {
        const agent = await Agent.findById(req.user._id).select('otbAccessStatus agentName emailAddress mobileNumber');
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        
        res.status(200).json({
            success: true,
            status: agent.otbAccessStatus,
            agent
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- AGENT OTB ACCESS SUBSCRIPTION ---

// @desc    Initiate Agent OTB Access Payment
// @route   POST /api/otb/subscription/initiate
// @access  Agent
const initiateOTBSubscription = async (req, res) => {
    try {
        const agent = await Agent.findById(req.user._id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        
        if (agent.otbAccessStatus === 'APPROVED') {
            return res.status(400).json({ success: false, message: 'Already have OTB access' });
        }

        const amount = 999;
        const order = await createRazorpayOrder(amount);

        res.status(200).json({
            success: true,
            order,
            amount,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Initiate Subscription Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Activate OTB Access using Wallet Balance
// @route   POST /api/otb/subscription/wallet
// @access  Agent
const activateOTBWithWallet = async (req, res) => {
    try {
        const agent = await Agent.findById(req.user._id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        
        if (agent.otbAccessStatus === 'APPROVED') {
            return res.status(400).json({ success: false, message: 'OTB access is already active.' });
        }

        const OTB_FEE = 999;
        if (agent.walletBalance < OTB_FEE) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient Wallet Balance. You need ₹${OTB_FEE.toLocaleString()} but have ₹${agent.walletBalance.toLocaleString()}.` 
            });
        }

        // Deduct from wallet
        agent.walletBalance -= OTB_FEE;
        agent.otbAccessStatus = 'PENDING_APPROVAL';
        await agent.save();

        // Create Transaction
        await Transaction.create({
            agentId: agent._id,
            amount: OTB_FEE,
            transactionType: 'DEBIT',
            purpose: 'OTB_ACCESS',
            referenceId: `OTB-WLT-${Date.now()}`,
            balanceAfterTransaction: agent.walletBalance,
            status: 'SUCCESS',
            description: 'OTB Lifetime Access Payment (via Wallet)'
        });

        res.status(200).json({
            success: true,
            message: 'Activation fee paid via wallet! Awaiting admin approval.',
            status: agent.otbAccessStatus
        });
    } catch (error) {
        console.error('OTB Wallet Payment Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Agent OTB Access Payment (Razorpay)
// @route   POST /api/otb/subscription/verify
// @access  Agent
const verifyOTBSubscription = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        const agent = await Agent.findById(req.user._id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        // Update Agent Status
        agent.otbAccessStatus = 'PENDING_APPROVAL';
        await agent.save();

        // Create Transaction record
        const amount = 999;
        await Transaction.create({
            agentId: agent._id,
            amount,
            transactionType: 'DEBIT',
            purpose: 'OTB_ACCESS',
            referenceId: razorpay_payment_id,
            balanceAfterTransaction: agent.walletBalance,
            status: 'SUCCESS',
            description: 'One-time payment for OTB Lifetime Access (Razorpay)'
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified. Awaiting admin approval.',
            status: agent.otbAccessStatus
        });
    } catch (error) {
        console.error('Verify Subscription Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Get all Agent OTB Access Requests
// @route   GET /api/admin/otb/agent-access-requests
// @access  Admin
const getAgentAccessRequests = async (req, res) => {
    try {
        const agents = await Agent.find({ 
            otbAccessStatus: { $in: ['PENDING_APPROVAL', 'REJECTED'] } 
        }).select('-password');
        res.status(200).json({ success: true, data: agents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Admin: Approve/Reject Agent OTB Access
// @route   PUT /api/admin/otb/approve-access/:agentId
// @access  Admin
const updateAgentOTBAccess = async (req, res) => {
    try {
        const { status, adminNotes } = req.body; // status: 'APPROVED' or 'REJECTED'
        const { agentId } = req.params;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const agent = await Agent.findByIdAndUpdate(
            agentId,
            { otbAccessStatus: status },
            { new: true }
        );

        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        // Notify Agent via Email
        await sendOTBAccessNotification(agent, status, adminNotes);

        // --- NEW: Trigger In-App Notification for Agent ---
        await createAgentNotification({
            agentId: agent._id,
            title: `OTB Access ${status === 'APPROVED' ? 'Activated' : 'Denied'}`,
            message: `Your OTB lifetime access request has been ${status.toLowerCase()}. ${adminNotes ? 'Admin Note: ' + adminNotes : ''}`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'ALERT',
            link: '/agent/otb'
        });

        res.status(200).json({
            success: true,
            message: `Agent OTB access ${status.toLowerCase()}`,
            agent
        });
    } catch (error) {
        console.error('Update Agent OTB Access Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- OTB PRICING MANAGEMENT ---

// @desc    Get all OTB Pricing
// @route   GET /api/otb/pricing
// @access  Public/Agent/Admin
const getOtbPricing = async (req, res) => {
    try {
        const pricing = await OtbPricing.find({ isActive: true }).sort({ airline: 1 });
        res.status(200).json({ success: true, data: pricing });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new OTB Pricing
// @route   POST /api/admin/otb/pricing
// @access  Admin
const createOtbPricing = async (req, res) => {
    try {
        const { airline, rate, group, isActive } = req.body;
        if (!airline || rate === undefined) {
            return res.status(400).json({ success: false, message: 'Airline and rate are required' });
        }
        
        const existing = await OtbPricing.findOne({ airline: { $regex: new RegExp('^' + airline + '$', 'i') } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Pricing for this airline already exists' });
        }

        const pricing = await OtbPricing.create({ airline, rate, group, isActive });
        res.status(201).json({ success: true, data: pricing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update OTB Pricing
// @route   PUT /api/admin/otb/pricing/:id
// @access  Admin
const updateOtbPricing = async (req, res) => {
    try {
        const pricing = await OtbPricing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });
        res.status(200).json({ success: true, data: pricing });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete OTB Pricing
// @route   DELETE /api/admin/otb/pricing/:id
// @access  Admin
const deleteOtbPricing = async (req, res) => {
    try {
        const pricing = await OtbPricing.findByIdAndDelete(req.params.id);
        if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });
        res.status(200).json({ success: true, message: 'Pricing deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createOTBRequest,
    verifyOTBPayment,
    getOTBStatus,
    updateOTBStatus,
    getAllOTBRequests,
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
};
