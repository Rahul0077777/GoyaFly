const mongoose = require('mongoose');
const Booking = require('./src/Models/Booking.model');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Zaha_production';

async function syncRoutes() {
    try {
        console.log('🚀 Starting Retroactive Route Sync...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        const bookings = await Booking.find({
            serviceType: { $in: ['FLIGHT', 'Flight'] },
            $or: [
                { fromCity: { $exists: false } },
                { fromCity: '' },
                { fromCity: 'Unknown' }
            ]
        });

        console.log(`🧐 Found ${bookings.length} potentially fixable records.`);

        let updated = 0;
        let skipped = 0;

        for (const b of bookings) {
            const segments = b.flightDetails;
            if (Array.isArray(segments) && segments.length > 0) {
                const first = segments[0];
                const last = segments[segments.length - 1];
                
                const fromCity = first.depCName || first.depCode || '';
                const toCity = last.arrCName || last.arrCode || '';
                const airline = first.airName || first.airline || '';

                if (fromCity && toCity) {
                    await Booking.updateOne(
                        { _id: b._id },
                        { 
                            $set: { 
                                fromCity, 
                                toCity, 
                                airline: airline || 'Flight' 
                            } 
                        }
                    );
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                skipped++;
            }
        }

        console.log(`\n✅ Sync Complete!`);
        console.log(`Updated: ${updated}`);
        console.log(`Skipped (No segment data): ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('💥 Sync failed:', err);
        process.exit(1);
    }
}

syncRoutes();
