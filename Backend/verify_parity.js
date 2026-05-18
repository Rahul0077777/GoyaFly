const { applyAdminMarkup } = require('./src/controllers/ftdFlight.controller');
const MarkupRule = require('./src/Models/MarkupRule.model');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const verifyFullParity = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Logic check for Markup application on a raw netfare
        const netfareValue = 10000;
        const isIntl = true;
        
        const serType = isIntl ? 'INTERNATIONAL_FLIGHT' : 'DOMESTIC_FLIGHT';
        const dummyFlight = { 
            price: netfareValue,
            airlineIata: 'FZ' // Fly Dubai
        };

        // Mock a rule for Fly Dubai International
        await MarkupRule.deleteOne({ airline: 'FZ' });
        await MarkupRule.create({
            serviceType: 'INTERNATIONAL_FLIGHT',
            airline: 'FZ',
            refundType: 'All',
            markupType: 'Fixed',
            markupValue: 1234,
            priority: 10,
            isActive: true
        });

        const markedFlights = await applyAdminMarkup([dummyFlight], serType);
        const adminMarkupApplied = markedFlights[0].adminMarkupApplied || 0;
        const bookingAmount = netfareValue + adminMarkupApplied;

        console.log(`Original Netfare: ${netfareValue}`);
        console.log(`Expected Markup: 1234`);
        console.log(`Actual Markup Applied: ${adminMarkupApplied}`);
        console.log(`Total Booking Amount (Price shown to user): ${bookingAmount}`);

        if (adminMarkupApplied === 1234 && bookingAmount === 11234) {
            console.log('✅ PASS: International Markup Parity verified!');
        } else {
            console.log('❌ FAIL: International Markup Mismatch!');
        }

        await MarkupRule.deleteOne({ airline: 'FZ' });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyFullParity();
