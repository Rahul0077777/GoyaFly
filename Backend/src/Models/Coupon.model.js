const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true }, // e.g., 'DIWALI500'
    discountType: { type: String, enum: ['FLAT', 'PERCENTAGE'], required: true },
    discountValue: { type: Number, required: true }, // e.g., 500 (flat) or 10 (percentage)
    maxDiscountAmount: { type: Number }, // Caps the max discount if using PERCENTAGE
    minBookingAmount: { type: Number, default: 0 }, // Protects your margins
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
