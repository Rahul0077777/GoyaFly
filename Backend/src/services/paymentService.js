const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (amount, currency = 'INR', method = null) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys not configured in environment');
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay amount is in paise (smallest currency unit)
            currency,
            receipt: `receipt_${Date.now()}`
        };

        // If a specific method is requested, add preferences
        if (method) {
            options.method = method;
        }

        console.log('Creating Razorpay order with options:', { amount: options.amount, currency, method });
        const order = await razorpay.orders.create(options);
        console.log('Razorpay order created successfully:', order.id);
        return order;
    } catch (error) {
        console.error('Razorpay Error:', error.message || error);
        logger.error('Razorpay Error: ' + JSON.stringify(error));
        throw new Error(error.message || 'Failed to create payment order');
    }
};

const verifySignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    // In production we must have a secret to validate signatures.
    // In development, allow bypassing this check to simplify local testing.
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            logger.error('Razorpay key secret is missing. Signature cannot be verified.');
            return false;
        }
        logger.warn('Razorpay key secret missing - skipping signature verification (dev only)');
        return true;
    }

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    const isValid = generatedSignature === signature;
    if (!isValid) {
        logger.warn('Razorpay signature mismatch', {
            expected: generatedSignature,
            provided: signature,
            orderId,
            paymentId,
        });
    }

    return isValid;
};

module.exports = { createRazorpayOrder, verifySignature };
