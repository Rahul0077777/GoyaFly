const mongoose = require('mongoose');

const holidayPackageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Package title is required'],
        trim: true
    },
    pkgId: {
        type: String,
        unique: true,
        required: [true, 'Package ID is required (e.g., PK-001)']
    },
    days: {
        type: String,
        required: [true, 'Duration is required (e.g., 4N/5D)']
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    highlights: {
        type: [String],
        default: []
    },
    iconType: {
        type: String,
        default: 'GENERIC'
    },
    destination: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        default: 'Luxury'
    },
    images: [{
        type: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('HolidayPackage', holidayPackageSchema);
