const mongoose = require('mongoose');

const rescheduleRequestSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    paxIds: [{ type: String }],
    newTravelDate: { type: String, required: true },
    flightDetails: { type: String, default: '' },
    remarks: { type: String, default: '' },
    
    status: { 
        type: String, 
        enum: ['PENDING_QUOTE', 'QUOTE_PROVIDED', 'ACCEPTED', 'REJECTED', 'PROCESSED'], 
        default: 'PENDING_QUOTE' 
    },
    
    quoteDetails: {
        fareDifference: { type: Number, default: 0 },
        airlinePenalty: { type: Number, default: 0 },
        adminMarkup: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.models.RescheduleRequest || mongoose.model('RescheduleRequest', rescheduleRequestSchema);
