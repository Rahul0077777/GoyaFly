const mongoose = require('mongoose');
const Booking = require('./Models/Booking.model');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkPending = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const pending = await Booking.find({ 
            $or: [
                { ftdStatus: 'Pending' },
                { status: 'PENDING' }
            ]
        }).sort({ createdAt: -1 });

        console.log(`Found ${pending.length} pending bookings.`);
        
        pending.slice(0, 5).forEach(b => {
            console.log(`- ID: ${b._id} | Ref: ${b.ftdBookingRef} | status: ${b.status} | ftdStatus: "${b.ftdStatus}" | Created: ${b.createdAt}`);
        });

        if (pending.length > 0) {
            const ageMs = Date.now() - new Date(pending[0].createdAt).getTime();
            console.log(`\nMost recent pending booking is ${Math.floor(ageMs / 60000)} minutes old.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkPending();
