const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getValidToken, getTokenStatus } = require('./services/ftdTokenService');
const logger = require('./utils/logger');

async function testToken() {
    try {
        console.log('--- FTD TOKEN DIAGNOSTIC ---');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Zaha_production');
        
        console.log('Checking current status...');
        const status = await getTokenStatus();
        console.log('Status Result:', status);

        console.log('\nAttempting to get/generate valid token...');
        const token = await getValidToken();
        console.log('\nSUCCESS! Token retrieved:', token.substring(0, 10) + '...');
        
    } catch (err) {
        console.error('\n❌ FAILED TO GET TOKEN');
        console.error('Error Message:', err.message);
        if (err.response) {
            console.error('FTD API Response:', JSON.stringify(err.response.data, null, 2));
        }
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

testToken();
