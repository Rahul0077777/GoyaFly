const mongoose = require('mongoose');

const visaPackageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Visa title is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country destination is required'],
        trim: true
    },
    visaType: {
        type: String,
        required: [true, 'Visa Type is required (e.g., Tourist, Business)']
    },
    processingTime: {
        type: String,
        required: [true, 'Processing time is required (e.g., 3-5 Days)']
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    documentsRequired: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    images: [{
        type: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('VisaPackage', visaPackageSchema);
