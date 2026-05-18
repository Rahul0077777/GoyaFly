const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chat } = require('../controllers/ai.controller');

// 1. Enforce Gemini Free Tier Minute Limit (15 Requests Per Minute)
const aiMinuteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15,
    message: { 
        success: false, 
        message: 'Google Gemini Free Tier limit reached (15 RPM). Please wait a minute before sending more messages.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Enforce Gemini Free Tier Daily Limit (1,500 Requests Per Day)
const aiDailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1500,
    message: { 
        success: false, 
        message: 'Google Gemini Free Tier daily limit reached (1,500 RPD). Quota will reset tomorrow.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/chat', aiMinuteLimiter, aiDailyLimiter, chat);

module.exports = router;
