const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const ftdFlightService = require('./src/services/ftdFlightService');

async function testFetchTrueStatus() {
    try {
        console.log("Checking status of FTD4JGWIAVVE3B4 (the likely Real Booking ID)...");
        const status1 = await ftdFlightService.checkBookingStatus('FTD4JGWIAVVE3B4');
        console.log("Status1 response:", status1);
        
        console.log("\nChecking status of FTD4JORLZ3YCBI8 (the Search Ref ID)...");
        const status2 = await ftdFlightService.checkBookingStatus('FTD4JORLZ3YCBI8');
        console.log("Status2 response:", status2);
    } catch (e) {
        console.error(e);
    }
}
testFetchTrueStatus();
