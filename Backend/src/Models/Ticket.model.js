const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['TECHNICAL', 'BILLING', 'BOOKING', 'CANCELLATION', 'OTHER'],
        default: 'OTHER'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['OPEN', 'PENDING_AGENT', 'PENDING_ADMIN', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    messages: [{
        senderModel: {
            type: String,
            required: true,
            enum: ['Agent', 'Admin']
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Update lastUpdate on each save
TicketSchema.pre('save', function() {
    this.lastUpdate = Date.now();
});

module.exports = mongoose.model('Ticket', TicketSchema);
