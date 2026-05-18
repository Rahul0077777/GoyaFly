const ftdFlightService = require('./services/ftdFlightService');
const logger = require('./utils/logger');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

const testVerifyPrice = async () => {
    try {
        await connectDB();
        const flightID = '3399116';
        const refID = 'FTD4JGWIAVVE3B4'; // Usually constant in test mode
        const originalNetfare = 0;

        console.log(`🔍 Testing verifyPrice for flightID: ${flightID}`);
        const result = await ftdFlightService.verifyPrice(flightID, refID, originalNetfare);
        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error caught in diagnostic:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
};

testVerifyPrice();
