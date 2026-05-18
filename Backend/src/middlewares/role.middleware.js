const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role || 'agent';

        // Case-insensitive check
        const isAuthorized = allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());

        if (!isAuthorized) {
            return res.status(403).json({ 
                success: false, 
                message: `Role '${userRole}' is not authorized to access this route.` 
            });
        }
        next();
    };
};

module.exports = { authorizeRoles };
