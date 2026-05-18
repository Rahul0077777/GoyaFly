const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getValidToken, getApiHeaders, FTD_CONFIG } = require('./services/ftdTokenService');

async function debugSearch() {
    try {
        console.log('Connecting to MongoDB for Token retrieval...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Zaha_production');

        const token = await getValidToken();
        const headers = getApiHeaders(token);
        
        const requestBody = { 
            // V1 / Legacy Names
            onDate: '20261010',
            reDate: '',
            adt: 1, chd: 0, inf: 1,
            
            // V2.5 / New Names
            depCity: 'DEL', arrCity: 'BOM', 
            depDate: '20261010', // YYYYMMDD
            retDate: '',
            AD: 1, CH: 0, IN: 0, 
            mode: 0, 
            isSME: 0, isFlexi: 0,
            tripType: 0, serType: 1,
            cabin: 'E',
            fareType: 'A'
        };

        const response = await axios.post(
            `${FTD_CONFIG.baseUrl}/postSearchFlightV2`,
            requestBody,
            { headers, timeout: 45000 }
        );

        const data = response.data;
        const raw = data.results || data.Flights || data.data || [];
        
        if (raw.length > 0) {
            const f = raw[0];
            console.log('\n--- DEEP PROBE: SEARCH ITEM ---');
            console.log('FULL ITEM JSON (First 500 chars):', JSON.stringify(f).substring(0, 500));
            console.log('Top Level Keys:', Object.keys(f));
            
            console.log('\nRefID Check:', data.Status?.refID || data.refID);
            
            // --- NEW: DIAGNOSE FARE DETAILS ---
            const flightID = f.flightID || f.FlightID || f.ID || f.Flights?.Onward?.[0]?.flightID;
            const refID = data.Status?.refID || data.refID;
            
            if (flightID && refID) {
                console.log(`\n--- PROBING FARE DETAILS (ID: ${flightID}) ---`);
                const fareResponse = await axios.post(
                    `${FTD_CONFIG.baseUrl}/postFareDetails`,
                    { flightID: parseInt(flightID), refID },
                    { headers, timeout: 30000 }
                );
                const fareData = fareResponse.data;
                console.log('FareDetails Keys:', Object.keys(fareData));
                const fares = fareData.results || fareData.data || (Array.isArray(fareData) ? fareData : []);
                console.log('Fares Found Count:', fares.length);
                if (fares.length > 0) {
                    console.log('First Fare Keys:', Object.keys(fares[0]));
                    console.log('First Fare netfare:', fares[0].Netfare || fares[0].Fare?.total?.netfare);
                }
            }
        } else {
            console.log('No data found:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

debugSearch();
