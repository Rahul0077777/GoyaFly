// 1. THIS MUST BE THE FIRST LINE
require('dotenv').config(); 

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const errorHandler = require('./middlewares/error.middleware');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import all route files
const agentRoutes = require('./routes/agent.routes');
const walletRoutes = require('./routes/wallet.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const commissionRoutes = require('./routes/commission.routes');
const taxRoutes = require('./routes/tax.routes');
const couponRoutes = require('./routes/coupon.routes');
const aiRoutes = require('./routes/ai.routes');
const otbRoutes = require('./routes/otb.routes');
const customerRoutes = require('./routes/customer.routes');
const marketingRoutes = require('./routes/marketing.routes');
const holidayRoutes = require('./routes/holiday.routes');
const adminHolidayRoutes = require('./routes/adminHoliday.routes');
const visaRoutes = require('./routes/visa.routes');
const adminVisaRoutes = require('./routes/adminVisa.routes');
const fixedDepartureRoutes = require('./routes/fixedDeparture.routes');
const adminFixedDepartureRoutes = require('./routes/adminFixedDeparture.routes');
const insuranceRoutes = require('./routes/insurance.routes');
const adminInsuranceRoutes = require('./routes/adminInsurance.routes');

const app = express();

// 1. Enable compression first to shrink all JSON responses
app.use(compression());

// Security and Logging Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false, // Allows images/PDFs to be viewed by frontend
})); 

// Professional CORS setup for scale
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://192.168.')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
})); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Professional security configurations for Express 5.x
const { safeSanitize } = require('./middlewares/security.middleware');
const { checkMaintenance } = require('./middlewares/maintenance.middleware');
app.use(safeSanitize);

// Serve the 'uploads' folder statically so agents can download tickets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const isProduction = process.env.NODE_ENV === 'production';
app.use(morgan(isProduction ? 'combined' : 'dev', {
    stream: { write: message => logger.info(message.trim()) }
}));

// Scaled Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20, // 20 attempts per hour
    message: { success: false, message: 'Too many login attempts. Please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/agents/login', authLimiter);
app.use('/api/agents/register', authLimiter);
app.use('/api/admin/login', authLimiter);

// Health Check Route
app.get('/api/status', (req, res) => {
    res.status(200).json({ success: true, message: 'B2B Travel Portal API is running smoothly!' });
});

// App-wide Maintenance Check
app.use('/api', checkMaintenance);

// Route Mounting
app.use('/api/agents', agentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/bookings', bookingRoutes);
app.use('/api/admin/commissions', commissionRoutes);
app.use('/api/admin/taxes', taxRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/otb', otbRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/admin/holidays', adminHolidayRoutes);
app.use('/api/visas', visaRoutes);
app.use('/api/admin/visas', adminVisaRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/admin/insurance', adminInsuranceRoutes);
app.use('/api/fixed-departures', fixedDepartureRoutes);
app.use('/api/admin/fixed-departures', adminFixedDepartureRoutes);

// 404 Handler (Route not found)
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API Route not found' });
});

// Global Error Handler Middleware (MUST be the last)
app.use(errorHandler);

module.exports = app;
