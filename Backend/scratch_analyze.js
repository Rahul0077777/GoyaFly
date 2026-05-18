const mongoose = require('mongoose');
const Booking = require('./src/Models/Booking.model');
require('dotenv').config();

async function analyzeOldData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/Zaha_production');
        console.log('Connected to DB');

        const oldBookings = await Booking.find({ 
            $or: [{ fromCity: '' }, { fromCity: 'Unknown' }, { fromCity: { $exists: false } }] 
        }).limit(5);

        console.log(`Found ${oldBookings.length} old bookings to analyze`);

        oldBookings.forEach((b, i) => {
            console.log(`\n--- Booking ${i+1} (${b._id}) ---`);
            console.log('Service:', b.serviceType);
            console.log('Flight Details:', JSON.stringify(b.flightDetails, null, 2));
            console.log('Passenger Details:', JSON.stringify(b.passengerDetails, null, 2));
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

analyzeOldData();
