const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Booking = require('./src/Models/Booking.model');
const ftdFlightService = require('./src/services/ftdFlightService');
const { generatePDFTicket } = require('./src/utils/ticketGenerator');

async function runDiagnostic() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const pendingBookings = await Booking.find({ status: 'PENDING' });
        console.log(`Found ${pendingBookings.length} PENDING bookings.`);

        if (pendingBookings.length > 0) {
            for (const b of pendingBookings) {
                console.log(`\n--- Checking Booking ID: ${b._id} | Ref: ${b.ftdBookingRef} ---`);
                try {
                    const status = await ftdFlightService.checkBookingStatus(b.ftdBookingRef);
                    console.log('FTD Status response:', status);
                } catch (e) {
                    console.log('Error checking status:', e.message);
                }
            }
        }
    } catch (e) {
        console.log('Diagnostic error:', e);
    } finally {
        mongoose.disconnect();
    }
}

runDiagnostic();
