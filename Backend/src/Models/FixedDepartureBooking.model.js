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
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
    passengers: [{
        name: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        passengerType: { type: String, enum: ['Adult', 'Child', 'Infant'], required: true },
        dob: { type: String, default: null },
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
    isInternational: { type: Boolean, default: false },
    remarks: { type: String, default: null }
}, { 
    timestamps: true 
});

const FixedDepartureBooking = mongoose.models.FixedDepartureBooking || mongoose.model('FixedDepartureBooking', fixedDepartureBookingSchema);

module.exports = FixedDepartureBooking;
