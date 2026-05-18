const jwt = require('jsonwebtoken');
const Customer = require('../Models/Customer.model');

const protectCustomer = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await Customer.findById(decoded.id);
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Customer not found' });
            }
            
            req.user.role = 'customer'; // Manually tag for controller logic
            return next();

        } catch (error) {
            console.error("Customer JWT Verification Error:", error.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, token failed' 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }
};

module.exports = { protectCustomer };
