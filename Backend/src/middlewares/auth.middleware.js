const jwt = require('jsonwebtoken');
// 1. FIX: Ensure 'models' matches your actual folder name (usually lowercase)
const Agent = require('../Models/Agent.model'); 

const protect = async (req, res, next) => {
    let token;

    // 2. Check for Bearer token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from string "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get agent from the database, excluding the password field for security
            const agent = await Agent.findById(decoded.id).select('-password').lean();
            if (agent) {
                if (agent.isBlocked) {
                    return res.status(403).json({ success: false, message: 'Your account is temporarily blocked by admin. Contact them to unblock.' });
                }
                agent.role = 'agent';
                req.user = agent;
            }

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            // 3. Move to the next middleware or controller
            return next(); 

        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, token failed or expired' 
            });
        }
    }

    // 4. If no token is found at all
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token provided' 
        });
    }
};

module.exports = { protect };
