require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/Models/Booking.model');
const ftdFlightService = require('./src/services/ftdFlightService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Zaha_production';

async function deepRecover() {
    try {
        console.log('🚀 Starting Deep Route Recovery Migration...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to Database.');

        const ftdTokenService = require('./src/services/ftdTokenService');
        console.log('📦 FTD Configuration Map:', {
            apiKey: ftdTokenService.FTD_CONFIG.apiKey ? 'PRESENT (Masked)' : 'MISSING',
            agentId: ftdTokenService.FTD_CONFIG.agentId,
            mode: ftdTokenService.FTD_CONFIG.mode
        });

        const bookings = await Booking.find({
            serviceType: { $in: ['FLIGHT', 'Flight'] },
            $or: [
                { fromCity: { $exists: false } },
                { fromCity: '' },
                { fromCity: 'Unknown' },
                { fromCity: 'Flight' }
            ]
        });

        console.log(`🧐 Found ${bookings.length} bookings requiring deep recovery.`);

        let successCount = 0;
        let failCount = 0;

        for (const b of bookings) {
            const ref = b.ftdBookingRef || b.providerReference || b.pnr;
            if (!ref || ref.length < 5) {
                console.log(`⚠️ Skipping Record ${b._id}: No valid reference found (${ref}).`);
                continue;
            }

            try {
                process.stdout.write(`🔄 Recovering ${ref}... `);
                
                // Call FTD API to get real status/segments
                const status = await ftdFlightService.checkBookingStatus(ref);
                
                // Extract flights
                const flights = status.Flights || (status.results && status.results[0] && status.results[0].Flights) || [];
                
                if (flights.length > 0) {
                    const first = flights[0];
                    const last = flights[flights.length - 1];
                    
                    const fromCity = first.depCName || first.depCity || first.depCode || '';
                    const toCity = last.arrCName || last.arrCity || last.arrCode || '';
                    const airline = first.airName || first.airline || '';

                    if (fromCity && toCity) {
                        await Booking.updateOne(
                            { _id: b._id },
                            { 
                                $set: { 
                                    fromCity, 
                                    toCity, 
                                    airline: airline || 'Flight',
                                    flightDetails: flights 
                                } 
                            }
                        );
                        process.stdout.write(`✅ Success: ${fromCity} -> ${toCity}\n`);
                        successCount++;
                    } else {
                        process.stdout.write(`❌ GDS returned empty city names.\n`);
                        failCount++;
                    }
                } else {
                    process.stdout.write(`❌ GDS returned no flight segments.\n`);
                    failCount++;
                }

                // Rate limiting protection for FTD API
                await new Promise(resolve => setTimeout(resolve, 500)); 

            } catch (err) {
                process.stdout.write(`❌ API Error: ${err.message}\n`);
                failCount++;
            }
        }

        console.log('\n--- Migration Results ---');
        console.log(`✅ Successfully Recovered: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log('-------------------------');

        process.exit(0);
    } catch (err) {
        console.error('💥 Critical Migration failure:', err);
        process.exit(1);
    }
}

deepRecover();
