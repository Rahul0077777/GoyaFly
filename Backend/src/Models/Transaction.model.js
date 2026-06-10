const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    agentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Agent', 
        required: true,
        index: true // Faster lookups for history
    },
    amount: { 
        type: Number, 
        required: true,
        min: [0, 'Amount cannot be negative'] 
    },
    transactionType: { 
        type: String, 
        enum: ['CREDIT', 'DEBIT'], 
        required: true 
    },
    purpose: { 
        type: String, 
        enum: ['WALLET_RECHARGE', 'TICKET_BOOKING', 'FLIGHT_BOOKING', 'COMMISSION', 'REFUND', 'OTB_ACCESS', 'CANCEL_REFUND', 'OTB_APPLICATION', 'ADMIN_ADJUSTMENT', 'RESCHEDULE_FEE'], 
        required: true 
    },
    walletType: {
        type: String,
        enum: ['MAIN', 'FIXED_DEPARTURE'],
        default: 'MAIN'
    },
    // We make referenceId unique to prevent duplicate processing of the same payment
    referenceId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    balanceAfterTransaction: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'SUCCESS', 'FAILED'], 
        default: 'PENDING' 
    },
    description: {
        type: String, // Optional: "Recharge via Razorpay" or "Booking for PNR: XYZ123"
        trim: true
    },
    // Granular Financial Breakdowns for Agency Statement
    gross: { type: Number, default: 0 },      // Total GDS Fare
    comm: { type: Number, default: 0 },       // Commission Earned
    txnFees: { type: Number, default: 0 },    // Platform/GDS transaction fees
    tds: { type: Number, default: 0 },        // Tax Deducted at Source on Comm
    pgFees: { type: Number, default: 0 },      // Payment Gateway fees
    markup: { type: Number, default: 0 },     // Agent Markup
    insurance: { type: Number, default: 0 },  // Insurance cost
    remark: { type: String, default: "" }      // Detailed remarks for statement
}, { timestamps: true });

// Create a compound index for faster history sorting
transactionSchema.index({ agentId: 1, createdAt: -1 });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
