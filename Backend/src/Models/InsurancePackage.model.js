const mongoose = require('mongoose');

const insurancePackageSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: [true, 'Insurance provider is required'],
        trim: true
    },
    plan: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    cover: {
        type: String,
        required: [true, 'Cover amount is required']
    },
    features: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    images: [{
        type: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('InsurancePackage', insurancePackageSchema);
