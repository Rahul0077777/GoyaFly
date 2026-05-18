const mongoose = require('mongoose');

const otbPricingSchema = new mongoose.Schema({
    airline: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    rate: { 
        type: Number, 
        required: true,
        min: 0
    },
    group: {
        type: String,
        default: 'A'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('OtbPricing', otbPricingSchema);
