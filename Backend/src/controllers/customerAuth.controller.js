const jwt = require('jsonwebtoken');
const Customer = require('../Models/Customer.model');
const logger = require('../utils/logger');

// Generate JWT for Customer
const generateToken = (id) => {
    return jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Send OTP to customer mobile
// @route   POST /api/customers/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        let customer = await Customer.findOne({ mobileNumber });

        if (!customer) {
            customer = await Customer.create({ mobileNumber, otp, otpExpiry });
        } else {
            customer.otp = otp;
            customer.otpExpiry = otpExpiry;
            await customer.save();
        }

        // SIMULATION: Log OTP to console (In production, send via SMS gateway)
        console.log(`[OTP SIMULATION] OTP for ${mobileNumber} is: ${otp}`);
        logger.info(`OTP generated for ${mobileNumber}: ${otp}`);

        res.status(200).json({ 
            success: true, 
            message: 'OTP sent successfully (Simulated)',
            // For testing convenience, we could send it in response if in DEV mode
            otp: process.env.NODE_ENV === 'development' ? otp : undefined 
        });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify OTP and login
// @route   POST /api/customers/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
        }

        const customer = await Customer.findOne({ 
            mobileNumber, 
            otp, 
            otpExpiry: { $gt: Date.now() } 
        });

        if (!customer) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        customer.otp = null;
        customer.otpExpiry = null;
        await customer.save();

        res.status(200).json({
            success: true,
            token: generateToken(customer._id),
            customer: {
                _id: customer._id,
                mobileNumber: customer.mobileNumber,
                email: customer.email
            }
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    sendOTP,
    verifyOTP
};
