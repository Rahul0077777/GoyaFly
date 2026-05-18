const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    serviceType: { 
        type: String, 
        enum: ['FLIGHT', 'HOTEL', 'BUS', 'TRAIN', 'VISA', 'INSURANCE', 'HOLIDAY'], 
        required: true 
    },
    providerReference: { type: String, required: true }, // e.g., The airline PNR or Hotel Confirmation Number
    passengerDetails: [{ type: mongoose.Schema.Types.Mixed }], // Array to hold varied passenger/guest data
    
    totalCost: { type: Number, required: true },
    commissionEarned: { type: Number, required: true },
    
    status: { 
        type: String, 
        enum: ['CONFIRMED', 'PENDING', 'CANCELLED', 'FAILED'], 
        default: 'PENDING' 
    },
    travelDate: { type: Date, required: true },
    fromCity: { type: String, default: '' },
    toCity: { type: String, default: '' },
    airline: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactMobile: { type: String, default: '' },

    // =============================================
    // FTD Travel API Fields
    // =============================================
    ftdBookingRef: { type: String, default: '' },         // FTD's booking reference ID
    pnr: { type: String, default: '' },                   // Airline PNR from FTD
    ftdStatus: { 
        type: String, 
        default: '' 
    },
    fareType: { type: String, default: '' },              // SME, Retail, Flexi
    netfare: { type: Number, default: 0 },                // Net fare from FTD
    gstDetails: { type: mongoose.Schema.Types.Mixed },     // GST data if gstind=1
    barcodeData: { type: String, default: '' },            // Raw Base64 barcode from FTD
    flightDetails: { type: mongoose.Schema.Types.Mixed },  // Raw flight segment array from GDS (Onward/Return details)
    ticketUrl: { type: String, default: '' },              // Generated E-Ticket PDF path
    passportDetails: [{ type: mongoose.Schema.Types.Mixed }], // For international bookings
    paymentMethod: { type: String, default: 'WALLET' },    // WALLET or RAZORPAY

    // --- NEW REFUND & POLICY FIELDS ---
    refundType: { type: String, default: 'Non-Refundable' }, // Refundable, P Refundable, Non-Refundable
    refundStatus: { 
        type: String, 
        enum: ['NA', 'PENDING_AIRLINE', 'PROCESSED', 'FAILED'], 
        default: 'NA' 
    },
    refundAmount: { type: Number, default: 0 },
    adminMarkupApplied: { type: Number, default: 0 },
    cancellationPolicyAcknowledged: { type: Boolean, default: false }

}, { timestamps: true });

// Optimization Indexes for High-Volume Bookings
bookingSchema.index({ agentId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ serviceType: 1 });
bookingSchema.index({ travelDate: 1 });
bookingSchema.index({ providerReference: 1 });
bookingSchema.index({ ftdStatus: 1 });              // For worker polling
bookingSchema.index({ ftdBookingRef: 1 });           // For quick FTD reference lookup

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
