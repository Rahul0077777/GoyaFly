const mongoose = require('mongoose');

const fixedDepartureSchema = new mongoose.Schema({
    airlineName: { type: String, required: true },
    flightNumber: { type: String, required: true },
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    departureDate: { type: Date, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    fare: { type: Number, required: true },
    childFare: { type: Number, default: 0 },
    infantFare: { type: Number, default: 0 },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Available', 'Sold Out', 'Hold', 'Cancelled'], 
        default: 'Available' 
    },
    isActive: { type: Boolean, default: true },
    isInternational: { type: Boolean, default: false },
    airlineLogo: { type: String, default: '' },
    fromAirportCode: { type: String, default: null },
    toAirportCode: { type: String, default: null },
    baggageAllowance: { type: String, default: null }
}, { 
    timestamps: true 
});

// Indexes for fast searching
fixedDepartureSchema.index({ fromCity: 1, toCity: 1, departureDate: 1 });
fixedDepartureSchema.index({ status: 1 });

const FixedDeparture = mongoose.models.FixedDeparture || mongoose.model('FixedDeparture', fixedDepartureSchema);

module.exports = FixedDeparture;
