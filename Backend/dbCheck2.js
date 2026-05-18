const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Booking = require('./src/Models/Booking.model');

async function checkBooking() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const booking = await Booking.findOne({ ftdBookingRef: 'FTD4JGWIAVVE3B4' });
        console.log("Booking found:", booking ? `ID: ${booking._id}, Status: ${booking.status}` : 'Not found');
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
checkBooking();
