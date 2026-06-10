const mongoose = require('mongoose');
const Agent = require('../Models/Agent.model');
const Transaction = require('../Models/Transaction.model');
const Booking = require('../Models/Booking.model');
const paymentService = require('../services/paymentService');

const createOrder = async (req, res, next) => {
    try {
        const { amount, method } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid recharge amount' });
        }
        
        const order = await paymentService.createRazorpayOrder(amount, 'INR', method);
        res.status(200).json({ success: true, data: { id: order.id, key: process.env.RAZORPAY_KEY_ID } });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
    }
};

const getBalance = async (req, res, next) => {
    try {
        const agent = await Agent.findById(req.user._id);
        if(!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        res.status(200).json({ success: true, balance: agent.walletBalance, fdBalance: agent.fdWalletBalance || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const rechargeWallet = async (req, res, next) => {
    try {
        // 1. Identify Agent (Auth or Body for testing)
        const agentId = req.user ? req.user._id : req.body.agentId;
        const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!agentId) return res.status(400).json({ success: false, message: 'Agent ID is required' });

        // 2. VERIFY SIGNATURE (Security Check)
        const isSignatureValid = paymentService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isSignatureValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const walletType = req.body.walletType === 'FIXED_DEPARTURE' ? 'FIXED_DEPARTURE' : 'MAIN';

        // 3. CHECK FOR DUPLICATE TRANSACTION (Prevent Double Credit)
        const existingTx = await Transaction.findOne({ referenceId: razorpay_payment_id });
        if (existingTx) {
            return res.status(400).json({ success: false, message: 'Transaction already processed' });
        }

        const updateQuery = walletType === 'FIXED_DEPARTURE' 
            ? { $inc: { fdWalletBalance: Number(amount) } }
            : { $inc: { walletBalance: Number(amount) } };

        // 4. ATOMIC UPDATE (Safer way to update balance)
        const updatedAgent = await Agent.findOneAndUpdate(
            { _id: agentId },
            updateQuery,
            { new: true, runValidators: true }
        );

        if (!updatedAgent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        // 5. CREATE TRANSACTION RECORD
        const transaction = await Transaction.create({
            agentId,
            amount: Number(amount),
            transactionType: 'CREDIT',
            purpose: 'WALLET_RECHARGE',
            walletType,
            referenceId: razorpay_payment_id,
            balanceAfterTransaction: walletType === 'FIXED_DEPARTURE' ? updatedAgent.fdWalletBalance : updatedAgent.walletBalance,
            status: 'SUCCESS',
            gross: Number(amount),
            remark: `Wallet recharge via ${razorpay_order_id}`
        });

        res.status(200).json({ 
            success: true, 
            message: 'Wallet recharged successfully', 
            data: { 
                newBalance: walletType === 'FIXED_DEPARTURE' ? updatedAgent.fdWalletBalance : updatedAgent.walletBalance, 
                transaction 
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Payment already processed' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWalletHistory = async (req, res, next) => {
    try {
        const agentId = req.user ? req.user._id : req.query.agentId || req.params.agentId;

        if (!agentId) return res.status(400).json({ success: false, message: 'Agent ID is required' });

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find({ agentId })
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit);

        const totalTransactions = await Transaction.countDocuments({ agentId });

        res.status(200).json({ 
            success: true, 
            count: transactions.length,
            pagination: {
                total: totalTransactions,
                page,
                pages: Math.ceil(totalTransactions / limit)
            },
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWalletStats = async (req, res, next) => {
    try {
        const agentObjId = new mongoose.Types.ObjectId(req.user._id.toString());

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Aggregate Totals from Transactions
        const txStats = await Transaction.aggregate([
            { $match: { agentId: agentObjId, status: 'SUCCESS' } },
            {
                $group: {
                    _id: null,
                    totalCredits: { $sum: { $cond: [{ $eq: ["$transactionType", "CREDIT"] }, "$amount", 0] } },
                    totalDebitTx: { $sum: { $cond: [{ $eq: ["$transactionType", "DEBIT"] }, "$amount", 0] } }
                }
            }
        ]);

        // Aggregate Totals from Bookings (for accurate historical "Spent" data)
        const bookingStats = await Booking.aggregate([
            { $match: { agentId: agentObjId, status: 'CONFIRMED' } },
            {
                $group: {
                    _id: null,
                    totalBookingSpent: { $sum: "$totalCost" },
                    avgBooking: { $avg: "$totalCost" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Aggregate Current Month from Transactions
        const currentMonthTx = await Transaction.aggregate([
            { $match: { 
                agentId: agentObjId, 
                status: 'SUCCESS',
                createdAt: { $gte: startOfMonth }
            } },
            {
                $group: {
                    _id: null,
                    credits: { $sum: { $cond: [{ $eq: ["$transactionType", "CREDIT"] }, "$amount", 0] } },
                    maxRecharge: { 
                        $max: { 
                            $cond: [{ $eq: ["$purpose", "WALLET_RECHARGE"] }, "$amount", 0] 
                        } 
                    }
                }
            }
        ]);

        // Aggregate Current Month from Bookings
        const currentMonthBookings = await Booking.aggregate([
            { $match: { 
                agentId: agentObjId, 
                status: 'CONFIRMED',
                createdAt: { $gte: startOfMonth }
            } },
            { $group: { _id: null, spent: { $sum: "$totalCost" } } }
        ]);

        // Previous Month Data
        const prevMonthTx = await Transaction.aggregate([
            { $match: { 
                agentId: agentObjId, 
                status: 'SUCCESS',
                createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
            } },
            { $group: { _id: null, credits: { $sum: { $cond: [{ $eq: ["$transactionType", "CREDIT"] }, "$amount", 0] } } } }
        ]);

        const prevMonthBookings = await Booking.aggregate([
            { $match: { 
                agentId: agentObjId, 
                status: 'CONFIRMED',
                createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
            } },
            { $group: { _id: null, spent: { $sum: "$totalCost" } } }
        ]);

        const tx = txStats[0] || { totalCredits: 0, totalDebitTx: 0 };
        const bk = bookingStats[0] || { totalBookingSpent: 0, avgBooking: 0 };
        const cmTx = currentMonthTx[0] || { credits: 0, maxRecharge: 0 };
        const cmBk = currentMonthBookings[0] || { spent: 0 };
        const pmTx = prevMonthTx[0] || { credits: 0 };
        const pmBk = prevMonthBookings[0] || { spent: 0 };

        // Total Spent is the sum of confirmed bookings + any non-booking debits (like OTB access etc)
        const totalSpent = bk.totalBookingSpent + (tx.totalDebitTx - bk.totalBookingSpent > 0 ? tx.totalDebitTx - bk.totalBookingSpent : 0);
        
        const calculateGrowth = (current, prev) => {
            if (prev === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - prev) / prev) * 100);
        };

        res.status(200).json({
            success: true,
            data: {
                totalCredits: tx.totalCredits,
                totalSpent: bk.totalBookingSpent || tx.totalDebitTx, // Fallback to tx if bk is empty
                avgBooking: Math.round(bk.avgBooking || 0),
                maxRecharge: cmTx.maxRecharge || 0,
                creditGrowth: calculateGrowth(cmTx.credits, pmTx.credits),
                spentGrowth: calculateGrowth(cmBk.spent, pmBk.spent),
                thisMonthCredits: cmTx.credits,
                thisMonthSpent: cmBk.spent
            }
        });

    } catch (error) {
        console.error('getWalletStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createOrder, rechargeWallet, getWalletHistory, getBalance, getWalletStats };
