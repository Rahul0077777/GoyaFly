const Coupon = require('../Models/Coupon.model');

const createCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const validateCoupon = async (req, res, next) => {
    try {
        const { code, bookingAmount } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or inactive coupon' });
        if (new Date(coupon.validUntil) < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
        if (bookingAmount < coupon.minBookingAmount) return res.status(400).json({ success: false, message: `Minimum booking amount is ₹${coupon.minBookingAmount}` });

        let discount = coupon.discountType === 'FLAT' ? coupon.discountValue : (bookingAmount * coupon.discountValue) / 100;
        if (coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
        }

        res.status(200).json({ 
            success: true, 
            message: 'Coupon applied', 
            data: { discountAmount: discount, finalPrice: bookingAmount - discount } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, message: 'Coupon updated', data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createCoupon, validateCoupon, getAllCoupons, updateCoupon, deleteCoupon };
