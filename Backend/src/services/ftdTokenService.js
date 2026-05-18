const axios = require('axios');
const FtdToken = require('../Models/FtdToken.model');
const logger = require('../utils/logger');

// FTD API Configuration — loaded from environment
const FTD_CONFIG = {
    baseUrl: process.env.FTD_BASE_URL || 'http://13.200.42.214/book/api',
    agentId: process.env.FTD_AGENT_ID || '',
    username: process.env.FTD_USERNAME || '',
    password: process.env.FTD_PASSWORD || '',
    apiKey: process.env.FTD_API_KEY || '',
    mode: process.env.FTD_MODE || '0'  // 0 = TEST
};

// Diagnostic log (One-time at startup)
if (!FTD_CONFIG.apiKey || FTD_CONFIG.apiKey === '') {
    logger.error('⚠️ FTD_API_KEY is missing in environment variables!');
} else {
    logger.info(`✅ FTD Configuration Loaded (Agent: ${FTD_CONFIG.agentId}, Mode: ${FTD_CONFIG.mode})`);
}

/**
 * Returns the mandatory FTD headers for the postCreateToken call
 * Token endpoint uses: username, password, agentid, mode, apikey
 */
const getTokenHeaders = () => ({
    'username': FTD_CONFIG.username,
    'password': FTD_CONFIG.password,
    'agentid': FTD_CONFIG.agentId,
    'Mode': FTD_CONFIG.mode,
    'Apikey': FTD_CONFIG.apiKey
});

/**
 * Returns the auth headers for subsequent API calls (search, fare, book)
 * These use x-api-key (the token) + mode
 */
const getApiHeaders = (token) => ({
    'x-api-key': token,
    'mode': FTD_CONFIG.mode,
    'Content-Type': 'application/json'
});

/**
 * Returns the booking headers (uses apikey + mode, NOT x-api-key)
 */
const getBookingHeaders = () => ({
    'Apikey': FTD_CONFIG.apiKey,
    'apikey': FTD_CONFIG.apiKey,
    'apiKey': FTD_CONFIG.apiKey,
    'x-api-key': FTD_CONFIG.apiKey,
    'Mode': FTD_CONFIG.mode,
    'mode': FTD_CONFIG.mode,
    'agentid': FTD_CONFIG.agentId,
    'Content-Type': 'application/json'
});

/**
 * Get today's date key in YYYY-MM-DD format (IST timezone)
 */
const getTodayDateKey = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
};

/**
 * Get the count of tokens generated today
 */
const getDailyTokenCount = async () => {
    const dateKey = getTodayDateKey();
    const count = await FtdToken.countDocuments({ dateKey });
    return count;
};

/**
 * Get a valid (non-expired) FTD token.
 * Returns cached token if still valid, otherwise generates a new one.
 * Enforces the 25 tokens/day limit.
 * 
 * FTD postCreateToken is a GET request with credentials in headers.
 * The response contains the token to use as x-api-key in subsequent calls.
 */
const getValidToken = async () => {
    try {
        const now = new Date();
        const dateKey = getTodayDateKey();

        // 1. STRICTURE REUSE: Find the latest valid token for today's dateKey
        const existingToken = await FtdToken.findOne({
            dateKey,
            expiresAt: { $gt: now }
        }).sort({ createdAt: -1 });

        if (existingToken) {
            logger.info(`FTD Auth: Reusing valid token (Daily ID: ${existingToken.tokenNumber})`);
            return existingToken.token;
        }

        // 2. TOKEN LIMIT ENFORCEMENT
        const dailyCount = await getDailyTokenCount();
        if (dailyCount >= 25) {
            const error = new Error('CRITICAL: FTD daily token generation limit reached (25/day). No more tokens can be created today.');
            error.statusCode = 429;
            logger.error(error.message);
            throw error;
        }

        // 3. GENERATE NEW TOKEN (MAX 25 PER DAY)
        logger.warn(`FTD Auth: Generating new daily token (${dailyCount + 1}/25)...`);

        const response = await axios.get(
            `${FTD_CONFIG.baseUrl}/postCreateToken`,
            { headers: getTokenHeaders(), timeout: 15000 }
        );

        const data = response.data;

        // CHECK FOR FTD Errors (IP not whitelisted, etc)
        if (data?.Status?.code === 0 || data?.code === 0 || data?.error_msg) {
            const msg = data.error_msg || data.Status?.message || 'Authentication failed';
            if (msg.toLowerCase().includes('ip') || msg.toLowerCase().includes('whitelist')) {
                throw new Error('FTD API Error: Server IP Address not whitelisted. Please contact FTD support.');
            }
            if (msg.toLowerCase().includes('limit')) {
                throw new Error('FTD API Error: Daily generation limit reached on the GDS side.');
            }
            throw new Error(`FTD Auth Error: ${msg}`);
        }

        // Extract token
        const newToken = data?.data || data?.token || data?.Token || data?.['x-api-key'] || 
                         (typeof data === 'string' ? data : null);

        if (!newToken) {
            throw new Error('FTD Auth: API returned success but no token string found in response.');
        }

        // 4. STORE LOCALLY FOR 24 HOURS
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        await FtdToken.create({
            token: newToken,
            createdAt: now,
            expiresAt,
            dateKey,
            tokenNumber: dailyCount + 1
        });

        logger.info(`FTD Auth: Successfully created token ${dailyCount + 1}/25. Valid until: ${expiresAt.toLocaleTimeString()}`);
        return newToken;

    } catch (error) {
        if (error.statusCode === 429) throw error;
        const errorMsg = error.response?.data?.error_msg || error.response?.data?.message || error.message;
        logger.error(`FTD Authentication Failure: ${errorMsg}`);
        throw new Error(`FTD Auth Failed: ${errorMsg}`);
    }
};

/**
 * Get token status info (for admin diagnostics)
 */
const getTokenStatus = async () => {
    const dateKey = getTodayDateKey();
    const dailyCount = await getDailyTokenCount();
    const currentToken = await FtdToken.findOne({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });

    return {
        hasValidToken: !!currentToken,
        tokenExpiresAt: currentToken?.expiresAt || null,
        tokensUsedToday: dailyCount,
        tokensRemainingToday: 25 - dailyCount,
        dateKey
    };
};

module.exports = { getValidToken, getDailyTokenCount, getTokenStatus, getApiHeaders, getBookingHeaders, FTD_CONFIG };
