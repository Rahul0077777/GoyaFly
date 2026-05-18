const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    mobileNumber: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    email: { 
        type: String, 
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// mobileNumber index already created by unique:true on the field


module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
