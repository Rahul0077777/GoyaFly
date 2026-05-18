const mongoose = require('mongoose');
const Booking = require('./src/Models/Booking.model');
require('dotenv').config();

const MONGO_URI = 'mongodb://localhost:27017/Zaha_production';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to Database for Migration...');

        const bookings = await Booking.find({
            $or: [
                { fromCity: { $exists: false } },
                { fromCity: '' },
                { fromCity: 'Unknown' }
            ]
        });

        console.log(`Analyzing ${bookings.length} potentially incomplete bookings...`);

        let updatedCount = 0;

        for (const b of bookings) {
            let fromCity = '';
            let toCity = '';
            let airline = '';

            // 1. Try FLIGHT specific details (FTD Segment Logic)
            if (b.serviceType === 'FLIGHT' || b.serviceType === 'Flight') {
                const segments = b.flightDetails || [];
                if (Array.isArray(segments) && segments.length > 0) {
                    const first = segments[0];
                    const last = segments[segments.length - 1];
                    
                    fromCity = first.depCode || first.depCName || '';
                    toCity = last.arrCode || last.arrCName || '';
                    airline = first.airName || first.airline || '';
                }
            }

            // 2. Try Passenger details fallback (Mock Logic)
            if (!fromCity && b.passengerDetails) {
                const pax = Array.isArray(b.passengerDetails) ? b.passengerDetails[0] : b.passengerDetails;
                if (pax) {
                    fromCity = pax.from || pax.depCity || '';
                    toCity = pax.to || pax.arrCity || '';
                    airline = pax.airline || pax.airlineName || '';
                }
            }

            // 3. Final Fallback - Extraction from providerReference or similar if needed
            // If still empty, we leave it for JIT repair or UI fallback

            if (fromCity || toCity || airline) {
                await Booking.updateOne(
                    { _id: b._id },
                    { 
                        $set: { 
                            fromCity: fromCity || 'Multi',
                            toCity: toCity || 'Sector',
                            airline: airline || 'Flight'
                        } 
                    }
                );
                updatedCount++;
            }
        }

        console.log(`Migration Complete: Successfully updated ${updatedCount} records.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
