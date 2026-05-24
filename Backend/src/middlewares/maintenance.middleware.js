const GlobalSetting = require('../Models/GlobalSetting.model');

const checkMaintenance = async (req, res, next) => {
    try {
        // Skip check for Admin routes and Status check
        if (req.path.startsWith('/admin') || req.path === '/status') {
            return next();
        }

        const settings = await GlobalSetting.findOne();
        if (settings && settings.maintenanceMode) {
            return res.status(503).json({ 
                success: false, 
                message: 'System is under maintenance. Please try again later.',
                maintenance: true
            });
        }

        if (settings && settings.otbServiceActive === false && req.path.startsWith('/otb')) {
            return res.status(503).json({ 
                success: false, 
                message: 'OTB Service is temporarily disabled by Admin. Please contact the administrator for any urgent requirements.'
            });
        }

        if (settings && settings.fixedDepartureServiceActive === false && req.path.startsWith('/fixed-departures')) {
            return res.status(503).json({ 
                success: false, 
                message: 'Fixed Departure Service is temporarily disabled by Admin. Please contact the administrator for any urgent requirements.'
            });
        }

        next();
    } catch (error) {
        // If settings fail, don't block the app, just log
        console.error('Maintenance check error:', error);
        next();
    }
};

module.exports = { checkMaintenance };
