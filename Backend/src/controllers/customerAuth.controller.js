const jwt = require('jsonwebtoken');
const Customer = require('../Models/Customer.model');
const logger = require('../utils/logger');

// Generate JWT for Customer
const generateToken = (id) => {
    return jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Send OTP to customer mobile/email
// @route   POST /api/customers/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    try {
        const { mobileNumber, email } = req.body;

        if (!mobileNumber && !email) {
            return res.status(400).json({ success: false, message: 'Mobile number or email is required' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        let query = {};
        if (mobileNumber) query.mobileNumber = mobileNumber;
        else if (email) query.email = email;

        let customer = await Customer.findOne(query);

        if (!customer) {
            customer = await Customer.create({ 
                mobileNumber: mobileNumber || `tmp_${Date.now()}`, // Fallback if schema requires it
                email, 
                otp, 
                otpExpiry 
            });
        } else {
            if (email) customer.email = email;
            if (mobileNumber && customer.mobileNumber.startsWith('tmp_')) customer.mobileNumber = mobileNumber;
            customer.otp = otp;
            customer.otpExpiry = otpExpiry;
            await customer.save();
        }

        if (email) {
            const { sendEmail } = require('../utils/notifier');
            const subject = 'Your GoyaFly OTP Code';
            const htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1D4171; margin: 0;">GoyaFly</h2>
                        <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">Secure Verification</p>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Your verification code is:</p>
                        <h1 style="margin: 0; color: #F07E21; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 20px;">
                        This code is valid for 10 minutes. Please do not share this code with anyone.
                    </p>
                    <div style="margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center;">
                        <p style="margin: 0; color: #333; font-size: 12px; font-weight: bold;">Regards,</p>
                        <p style="margin: 0; color: #333; font-size: 12px;">GoyaFly.com</p>
                    </div>
                </div>
            `;
            await sendEmail(email, subject, htmlBody);
            logger.info(`OTP Email sent to ${email}`);
        } else {
            // SIMULATION: Log OTP to console (In production, send via SMS gateway)
            console.log(`[OTP SIMULATION] OTP for ${mobileNumber} is: ${otp}`);
            logger.info(`OTP generated for ${mobileNumber}: ${otp}`);
        }

        res.status(200).json({ 
            success: true, 
            message: email ? 'OTP sent to your email successfully' : 'OTP sent successfully (Simulated SMS)',
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
        const { mobileNumber, email, otp } = req.body;

        if ((!mobileNumber && !email) || !otp) {
            return res.status(400).json({ success: false, message: 'Mobile number or email, and OTP are required' });
        }

        let query = { otp, otpExpiry: { $gt: Date.now() } };
        if (mobileNumber) query.mobileNumber = mobileNumber;
        else if (email) query.email = email;

        const customer = await Customer.findOne(query);

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
