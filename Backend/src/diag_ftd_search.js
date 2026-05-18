const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getValidToken, getApiHeaders, FTD_CONFIG } = require('./services/ftdTokenService');

async function testSearch() {
    try {
        console.log('--- FTD SEARCH DIAGNOSTIC ---');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Zaha_production');

        const token = await getValidToken();
        const headers = getApiHeaders(token);
        
        const requestBody = { 
            depCity: 'DEL', arrCity: 'BOM', 
            depDate: '20260410', 
            AD: 1, CH: 0, IN: 0, 
            mode: 0, 
            isSME: 0, isFlexi: 0 
        };

        console.log('Searching DEL -> BOM...');
        const response = await axios.post(
            `${FTD_CONFIG.baseUrl}/postSearchFlightV2`,
            requestBody,
            { headers, timeout: 45000 }
        );

        const data = response.data;
        if (data && data.Flights && data.Flights.length > 0) {
            const firstFlight = data.Flights[0];
            console.log('\nTop Level Flight Keys:', Object.keys(firstFlight));
            console.log('FlightID:', firstFlight.flightID);
            
            if (firstFlight.Flights && firstFlight.Flights.Onward) {
                const firstSeg = firstFlight.Flights.Onward[0];
                console.log('Onward[0] Keys:', Object.keys(firstSeg));
                console.log('Onward[0].flightID:', firstSeg.flightID);
            }
        } else {
            console.log('No flights found or error response:', data);
        }
        
    } catch (err) {
        console.error('Search Failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    } finally {
        process.exit();
    }
}

testSearch();
