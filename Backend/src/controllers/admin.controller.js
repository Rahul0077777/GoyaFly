const Admin = require('../Models/Admin.model');
const Agent = require('../Models/Agent.model');
const Booking = require('../Models/Booking.model');
const Promotion = require('../Models/Promotion.model');
const Notification = require('../Models/Notification.model');
const { sendEmail } = require('../utils/notifier');
const generateToken = require('../utils/generateToken');

const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (admin && (await admin.matchPassword(password))) {
            res.status(200).json({ 
                success: true, 
                data: { 
                    _id: admin._id, 
                    name: admin.name, 
                    role: admin.role, 
                    token: generateToken(admin._id, '1d') 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const approveAgentKyc = async (req, res, next) => {
    try {
        const { status, reason } = req.body; // status: 'APPROVED' or 'REJECTED'
        const agent = await Agent.findById(req.params.id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        if (status === 'APPROVED') {
            agent.kycStatus = 'APPROVED';
            agent.isKycVerified = true;
            agent.kycRejectReason = null;
            
            // The pre-save hook will generate agentCode if missing
            await agent.save();
            
            // Send Confirmation Email
            const emailSubject = 'Your Goyafly B2B Portal Agent ID is Activated!';
            const emailBody = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1e293b; margin: 0; font-size: 28px; font-weight: 900;">GOYAFLY</h1>
                        <p style="color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-size: 10px; font-weight: 700;">Partner Network</p>
                    </div>
                    
                    <h2 style="color: #2c3e50; font-size: 20px; font-weight: 800;">Congratulations!</h2>
                    <p style="color: #475569; line-height: 1.6;">Dear ${agent.agentName},</p>
                    <p style="color: #475569; line-height: 1.6;">Your KYC verification has been <strong>APPROVED</strong>. Welcome to the Goyafly B2B Partner Network!</p>
                    
                    <div style="background: #f8fafc; padding: 30px; border-radius: 15px; margin: 30px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Access Details:</h3>
                        <p style="margin: 10px 0; color: #1e293b; font-weight: 700;">Agent ID: <span style="font-size: 24px; color: #eb5a0c; font-weight: 900; margin-left: 10px;">${agent.agentCode}</span></p>
                        <p style="margin: 10px 0; color: #1e293b; font-weight: 700;">Agency: <span style="color: #475569; font-weight: 500;">${agent.agencyName}</span></p>
                        <p style="margin: 10px 0; color: #1e293b; font-weight: 700;">Login ID: <span style="color: #475569; font-weight: 500;">${agent.emailAddress}</span></p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="https://goyafly.com/agent/login" style="background: #1e293b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Login to Dashboard</a>
                    </div>
                    
                    <p style="color: #475569; line-height: 1.6;">You can now log in to your dashboard to start booking flights, visas, and holiday packages with exclusive agent fares.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6;">This is an automated message. Please do not reply directly to this email.<br/>If you have any questions, contact our support team at <strong>support@goyafly.com</strong></p>
                </div>
            `;
            await sendEmail(agent.emailAddress, emailSubject, emailBody);
        } else if (status === 'REJECTED') {
            agent.kycStatus = 'REJECTED';
            agent.isKycVerified = false;
            agent.kycRejectReason = reason || 'Documents invalid or blurry.';
            await agent.save();
        }

        res.status(200).json({ 
            success: true, 
            message: `Agent KYC ${status} successfully`, 
            data: { agentId: agent._id, status: agent.kycStatus, agentCode: agent.agentCode } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Added this so your Admin Dashboard can actually list the agents!
const getAllAgents = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = search ? {
            $or: [
                { agencyName: { $regex: search, $options: 'i' } },
                { emailAddress: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const agents = await Agent.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Agent.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: agents,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getStats = async (req, res, next) => {
    try {
        const totalAgents = await Agent.countDocuments();
        const pendingKyc = await Agent.countDocuments({ isKycVerified: false });
        const totalBookings = await Booking.countDocuments();
        
        // Revenue calculation
        const revenueResult = await Booking.aggregate([{ $group: { _id: null, total: { $sum: '$totalCost' } } }]);
        const revenue = revenueResult[0]?.total || 0;
        
        // Growth (simplified for now: agents in last 30 days)
        const lastMonthDate = new Date();
        lastMonthDate.setDate(lastMonthDate.getDate() - 30);
        const newAgentsLastMonth = await Agent.countDocuments({ createdAt: { $gte: lastMonthDate } });
        const growth = totalAgents > 0 ? ((newAgentsLastMonth / totalAgents) * 100).toFixed(1) : 0;

        // Weekly bookings
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyBookings = await Booking.countDocuments({ createdAt: { $gte: oneWeekAgo } });

        const recentAgents = await Agent.find().sort({ createdAt: -1 }).limit(5).select('agentName emailAddress isKycVerified createdAt');

        // Random Load for dynamism
        const systemLoad = Math.floor(Math.random() * 15) + 5; 

        res.status(200).json({
            success: true,
            data: {
                revenue,
                activeAgents: totalAgents - pendingKyc,
                pendingKyc,
                weeklyBookings,
                growth: `+${growth}% from last month`,
                systemLoad: `${systemLoad}%`,
                recentAgentsList: recentAgents
            }
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error while fetching stats' });
    }
};

const deleteAgent = async (req, res, next) => {
    try {
        const agent = await Agent.findByIdAndDelete(req.params.id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        res.status(200).json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAgent = async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        
        // Handle Logo Upload if provided by Admin
        if (req.file) {
            updateData.logo = `/uploads/${req.file.filename}`;
        }

        const agent = await Agent.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        res.status(200).json({ success: true, message: 'Agent updated successfully', data: agent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createAgent = async (req, res, next) => {
    try {
        const { agentName, agencyName, emailAddress, mobileNumber, password, address, gstNumber } = req.body;
        
        const agentExists = await Agent.findOne({ $or: [{ emailAddress }, { mobileNumber }] });
        if (agentExists) return res.status(400).json({ success: false, message: 'Agent with this email or mobile already exists' });

        const agent = await Agent.create({
            agentName,
            agencyName,
            emailAddress,
            mobileNumber,
            password,
            address,
            gstNumber,
            isKycVerified: true
        });

        res.status(201).json({ success: true, message: 'Agent created successfully', data: agent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Promotion Controllers
const createPromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.create(req.body);
        res.status(201).json({ success: true, message: 'Promotion created successfully', data: promotion });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPromotions = async (req, res, next) => {
    try {
        const promotions = await Promotion.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: promotions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found' });
        res.status(200).json({ success: true, message: 'Promotion updated successfully', data: promotion });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found' });
        res.status(200).json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSubAgents = async (req, res, next) => {
    try {
        // Query for agents who have a parentAgent
        const subAgents = await Agent.find({ parentAgent: { $ne: null } })
            .populate('parentAgent', 'agencyName agentName')
            .sort({ createdAt: -1 });

        // For each sub-agent, calculate monthly volume (bookings in current month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const subAgentsWithVolume = await Promise.all(subAgents.map(async (sa) => {
            const volume = await Booking.countDocuments({ 
                agentId: sa._id, 
                createdAt: { $gte: startOfMonth } 
            });
            return {
                ...sa._doc,
                monthlyVolume: volume
            };
        }));

        res.status(200).json({ success: true, data: subAgentsWithVolume });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSubAgentStats = async (req, res, next) => {
    try {
        const totalSubAgents = await Agent.countDocuments({ parentAgent: { $ne: null } });
        
        // Tier-2 revenue: Sum commissions of all bookings by sub-agents
        const subAgents = await Agent.find({ parentAgent: { $ne: null } }).select('_id');
        const subAgentIds = subAgents.map(sa => sa._id);
        
        const bookings = await Booking.find({ agentId: { $in: subAgentIds } });
        const revenue = bookings.reduce((sum, b) => sum + (b.commissionEarned || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                totalSubAgents,
                revenueTier2: revenue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Define date range
        let start = startDate ? new Date(startDate) : new Date();
        if (!startDate) {
            start.setDate(1); // Default to start of month
        }
        start.setHours(0, 0, 0, 0);

        let end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Previous period for growth (same duration)
        const duration = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - duration - 1000);
        const prevEnd = new Date(start.getTime() - 1000);

        const matchStage = { 
            status: 'CONFIRMED', 
            createdAt: { $gte: start, $lte: end } 
        };

        const prevMatchStage = {
            status: 'CONFIRMED',
            createdAt: { $gte: prevStart, $lte: prevEnd }
        };

        // 1. KPI Stats
        const totalAgents = await Agent.countDocuments();
        const newAgents = await Agent.countDocuments({ createdAt: { $gte: start, $lte: end } });
        
        const bookingsResult = await Booking.aggregate([
            { $match: matchStage },
            { $group: { 
                _id: null, 
                totalRevenue: { $sum: '$totalCost' },
                count: { $sum: 1 } 
            } }
        ]);
        const totalRevenue = bookingsResult[0]?.totalRevenue || 0;
        const totalBookings = bookingsResult[0]?.count || 0;
        const avgTicketValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

        // 2. Growth Calculation
        const prevRevenueResult = await Booking.aggregate([
            { $match: prevMatchStage },
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]);

        const prevRevenue = prevRevenueResult[0]?.total || 0;
        let growth = 0;
        if (prevRevenue > 0) {
            growth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
        } else if (totalRevenue > 0) {
            growth = 100;
        }

        // 3. Revenue Velocity
        const velocity = await Booking.aggregate([
            { $match: matchStage },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                dailyRevenue: { $sum: "$totalCost" }
            }},
            { $sort: { "_id": 1 } }
        ]);

        // 4. Service Distribution
        const distribution = await Booking.aggregate([
            { $match: matchStage },
            { $group: { _id: "$serviceType", count: { $sum: 1 } } }
        ]);

        // 5. Top Agents
        const topAgents = await Booking.aggregate([
            { $match: matchStage },
            { $group: { 
                _id: "$agentId", 
                totalSpent: { $sum: "$totalCost" },
                bookingCount: { $sum: 1 } 
            }},
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            { $lookup: {
                from: 'agents',
                localField: '_id',
                foreignField: '_id',
                as: 'agentInfo'
            }},
            { $unwind: "$agentInfo" },
            { $project: {
                agencyName: "$agentInfo.agencyName",
                agentName: "$agentInfo.agentName",
                totalSpent: 1,
                bookingCount: 1
            }}
        ]);

        res.status(200).json({
            success: true,
            data: {
                kpis: {
                    monthlyGrowth: (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%',
                    avgTicketValue: '₹' + avgTicketValue.toLocaleString(),
                    newAgents,
                    conversionRate: ((totalBookings / (totalAgents || 1)) * 5).toFixed(1) + '%'
                },
                revenueVelocity: velocity,
                serviceDistribution: distribution,
                topAgents,
                period: { start, end }
            }
        });
    } catch (error) {
        console.error('Admin Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error while fetching analytics' });
    }
};

const getAllOtbRequests = async (req, res, next) => {
    try {
        const OTBRequest = require('../Models/OTBRequest.model');
        const requests = await OTBRequest.find()
            .populate('agentId', 'agencyName agentName')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOtbAgentRequests = async (req, res, next) => {
    try {
        // Query agents who have requested OTB access but aren't approved yet
        // Assuming a field like `otbAccessStatus` or just checking `isOtbAccessGranted`
        const agents = await Agent.find({ isOtbAccessGranted: false }).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: agents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateOtbStatus = async (req, res, next) => {
    try {
        const OTBRequest = require('../Models/OTBRequest.model');
        const request = await OTBRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const approveOtbAgentAccess = async (req, res, next) => {
    try {
        const agent = await Agent.findById(req.params.id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        agent.isOtbAccessGranted = req.body.isGranted;
        await agent.save();

        res.status(200).json({ success: true, message: 'Agent OTB access updated', data: agent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const adjustAgentWallet = async (req, res, next) => {
    try {
        const { agentId, amount, type, remark } = req.body;
        const agent = await Agent.findById(agentId);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        const adjustmentAmount = type === 'CREDIT' ? Number(amount) : -Number(amount);
        agent.walletBalance += adjustmentAmount;
        await agent.save();

        const Transaction = require('../Models/Transaction.model');
        await Transaction.create({
            agentId,
            amount: Math.abs(adjustmentAmount),
            transactionType: type,
            purpose: 'ADMIN_ADJUSTMENT',
            referenceId: `ADJ-${Date.now()}`,
            balanceAfterTransaction: agent.walletBalance,
            status: 'SUCCESS',
            gross: Math.abs(adjustmentAmount),
            remark: remark || 'Admin Adjustment'
        });

        res.status(200).json({ success: true, message: `Wallet ${type === 'CREDIT' ? 'credited' : 'debited'} successfully`, data: { balance: agent.walletBalance } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleBlockAgent = async (req, res, next) => {
    try {
        const agent = await Agent.findById(req.params.id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        agent.isBlocked = !agent.isBlocked;
        await agent.save();

        const statusLabel = agent.isBlocked ? 'Blocked' : 'Unblocked';

        // 1. Create In-App Notification
        await Notification.create({
            agentId: agent._id,
            title: `Account ${statusLabel}`,
            message: agent.isBlocked 
                ? 'Your account has been temporarily blocked by admin. Please contact support for assistance.' 
                : 'Your account has been unblocked by admin. You can now resume your activities.',
            category: 'SYSTEM'
        });

        // 2. Send Email
        const emailSubject = `Account ${statusLabel} - GoyaFly`;
        const emailBody = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: ${agent.isBlocked ? '#e53e3e' : '#38a169'};">Account ${statusLabel}</h2>
                <p>Hello ${agent.agentName},</p>
                <p>${agent.isBlocked 
                    ? 'Your account (<b>' + agent.agencyName + '</b>) has been <b>temporarily blocked</b> by the administrator.' 
                    : 'Great news! Your account (<b>' + agent.agencyName + '</b>) has been <b>unblocked</b> and is now active.'}</p>
                <p>${agent.isBlocked 
                    ? 'While your account is blocked, you will not be able to search for flights, make bookings, or access your wallet. Please contact our support team to resolve this.' 
                    : 'You can now log in and continue your bookings as usual.'}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">This is an automated system notification. Please do not reply to this email.</p>
            </div>
        `;

        await sendEmail(agent.emailAddress, emailSubject, emailBody);

        res.status(200).json({ 
            success: true, 
            message: `Agent ${statusLabel} successfully`, 
            data: { isBlocked: agent.isBlocked } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllRefunds = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const skip = (page - 1) * limit;

        const query = { status: 'CANCELLED' };
        if (status) {
            query.refundStatus = status;
        }

        const bookings = await Booking.find(query)
            .populate('agentId', 'agencyName agentName')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const processManualRefund = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const { airlineRefundAmount, adminDeduction, action } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.status !== 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Only cancelled bookings can be refunded.' });
        }

        if (booking.refundStatus === 'PROCESSED' || booking.refundStatus === 'REJECTED') {
            return res.status(400).json({ success: false, message: 'Refund already processed or rejected for this booking.' });
        }

        const agent = await Agent.findById(booking.agentId);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        if (action === 'REJECT') {
            booking.refundStatus = 'REJECTED';
            booking.refundAmount = 0;
            await booking.save();

            // Notify Agent
            try {
                const Notification = require('../Models/Notification.model');
                await Notification.create({
                    agentId: agent._id,
                    title: 'Refund Rejected',
                    message: `Refund for cancelled booking (PNR: ${booking.pnr}) was rejected by the airline. No wallet credit will be issued.`,
                    category: 'WALLET'
                });
            } catch (err) {
                console.error('Failed to send refund rejection notification:', err);
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Refund rejected successfully', 
                data: booking 
            });
        }

        // Process Action
        const finalRefund = Number(airlineRefundAmount) - Number(adminDeduction);
        
        if (finalRefund < 0) {
            return res.status(400).json({ success: false, message: 'Final refund amount cannot be negative.' });
        }

        // Credit Wallet
        agent.walletBalance += finalRefund;
        await agent.save();

        // Create Ledger Transaction
        const Transaction = require('../Models/Transaction.model');
        await Transaction.create({
            agentId: agent._id,
            amount: finalRefund,
            transactionType: 'CREDIT',
            purpose: 'CANCEL_REFUND',
            referenceId: `REF-${booking.pnr || booking.ftdBookingRef}-${Date.now()}`,
            balanceAfterTransaction: agent.walletBalance,
            status: 'SUCCESS',
            paymentMethod: 'WALLET',
            remark: `Refund Processed. Airline Refund: ₹${airlineRefundAmount}, Admin Deduction: ₹${adminDeduction}, Net Credit: ₹${finalRefund} | PNR: ${booking.pnr}`
        });

        // Update Booking
        booking.refundStatus = 'PROCESSED';
        booking.refundAmount = finalRefund;
        booking.cancellationCharges = (booking.totalCost - airlineRefundAmount) + Number(adminDeduction); 
        await booking.save();

        // Notify Agent (Optional but good UX)
        try {
            const Notification = require('../Models/Notification.model');
            await Notification.create({
                agentId: agent._id,
                title: 'Refund Processed',
                message: `A refund of ₹${finalRefund} for cancelled booking (PNR: ${booking.pnr}) has been credited to your wallet.`,
                category: 'WALLET'
            });
        } catch (err) {
            console.error('Failed to send refund notification:', err);
        }

        res.status(200).json({ 
            success: true, 
            message: 'Refund processed successfully', 
            data: booking 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// RESCHEDULE MANAGEMENT
// ==========================================
const RescheduleRequest = require('../Models/RescheduleRequest.model');

const getAllReschedules = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status;

        let query = {};
        if (status) {
            query.status = status;
        }

        const reschedules = await RescheduleRequest.find(query)
            .populate('bookingId', 'pnr ftdBookingRef fromCity toCity travelDate status providerReference')
            .populate('agentId', 'agencyName name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await RescheduleRequest.countDocuments(query);

        res.status(200).json({
            success: true,
            data: reschedules,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const provideRescheduleQuote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fareDifference, airlinePenalty, adminMarkup } = req.body;

        const request = await RescheduleRequest.findById(id).populate('bookingId agentId');
        if (!request) return res.status(404).json({ success: false, message: 'Reschedule request not found' });

        if (request.status !== 'PENDING_QUOTE') {
            return res.status(400).json({ success: false, message: 'Quote can only be provided for pending requests.' });
        }

        const totalAmount = Number(fareDifference) + Number(airlinePenalty) + Number(adminMarkup);

        request.quoteDetails = {
            fareDifference: Number(fareDifference),
            airlinePenalty: Number(airlinePenalty),
            adminMarkup: Number(adminMarkup),
            totalAmount
        };
        request.status = 'QUOTE_PROVIDED';
        await request.save();

        // Notify Agent
        const { sendEmail } = require('../utils/notifier');
        if (request.agentId && request.agentId.email) {
            const subject = `Reschedule Quotation Ready [PNR: ${request.bookingId.pnr || request.bookingId.providerReference}]`;
            const body = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Reschedule Quotation Available</h2>
                    <p>Dear ${request.agentId.name},</p>
                    <p>We have calculated the reissue cost for PNR: <b>${request.bookingId.pnr || request.bookingId.providerReference}</b>.</p>
                    <ul>
                        <li>Fare Difference: ₹${fareDifference}</li>
                        <li>Airline Penalty: ₹${airlinePenalty}</li>
                        <li>Service Fee: ₹${adminMarkup}</li>
                        <li><b>Total to Pay: ₹${totalAmount}</b></li>
                    </ul>
                    <p>Please log in to your portal, go to your booking history, and accept the quote to finalize the reschedule.</p>
                </div>
            `;
            await sendEmail(request.agentId.email, subject, body).catch(e => console.error('Mail fail', e));
        }

        res.status(200).json({ success: true, message: 'Quote provided successfully', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const processReschedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await RescheduleRequest.findById(id).populate('bookingId');
        if (!request) return res.status(404).json({ success: false, message: 'Not found' });

        if (request.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Can only process requests that agent has accepted.' });
        }

        request.status = 'PROCESSED';
        await request.save();

        // Update booking status
        const booking = request.bookingId;
        booking.status = 'CONFIRMED';
        await booking.save();

        res.status(200).json({ success: true, message: 'Reschedule marked as processed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { loginAdmin, approveAgentKyc, getAllAgents, getStats, deleteAgent, updateAgent, createAgent, createPromotion, getPromotions, updatePromotion, deletePromotion, getSubAgents, getSubAgentStats, getAnalytics, getAllOtbRequests, getOtbAgentRequests, updateOtbStatus, approveOtbAgentAccess, adjustAgentWallet, toggleBlockAgent, getAllRefunds, processManualRefund, getAllReschedules, provideRescheduleQuote, processReschedule };
