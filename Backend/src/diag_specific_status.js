const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { checkBookingStatus } = require('./services/ftdFlightService');
const logger = require('./utils/logger');

const diagStatus = async () => {
    const refID = 'FTD4JHS01BTEA0W';
    console.log(`Checking FTD status for: ${refID}`);
    
    try {
        const result = await checkBookingStatus(refID);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
};

diagStatus();
