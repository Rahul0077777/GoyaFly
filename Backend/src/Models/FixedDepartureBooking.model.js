const mongoose = require('mongoose');

const fixedDepartureBookingSchema = new mongoose.Schema({
    agentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Agent', 
        required: true 
    },
    flightId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'FixedDeparture', 
        required: true 
    },
    passengers: [{
        name: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        dob: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        mobileNumber: { type: String, required: true },
        email: { type: String, required: true },
        passportNumber: { type: String, default: null },
        passportExpiry: { type: String, default: null },
        nationality: { type: String, default: 'IN' }
    }],
    totalFare: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Hold'], 
        default: 'Pending' 
    },
    pnr: { type: String, default: null },
    ticketNumber: { type: String, default: null },
    bookingDate: { type: Date, default: Date.now },
    pdfUrl: { type: String, default: null },
    paymentVerified: { type: Boolean, default: false },
    isInternational: { type: Boolean, default: false }
}, { 
    timestamps: true 
});

const FixedDepartureBooking = mongoose.models.FixedDepartureBooking || mongoose.model('FixedDepartureBooking', fixedDepartureBookingSchema);

module.exports = FixedDepartureBooking;
