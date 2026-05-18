const Coupon = require('../Models/Coupon.model');

const createCoupon = async (req, res, next) => {
    try {
        const { code, discountType, discountValue, maxDiscountAmount, validUntil } = req.body;

        const coupon = await Coupon.create({
            code, discountType, discountValue, maxDiscountAmount, validUntil
        });

        res.status(201).json({ message: 'Coupon created successfully', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createCoupon };
