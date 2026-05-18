const mongoose = require('mongoose');
const MarkupRule = require('./src/Models/MarkupRule.model');
const dotenv = require('dotenv');
dotenv.config();

const testMarkup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB Connected');

        const testRule = {
            serviceType: 'DOMESTIC_FLIGHT',
            airline: '6E',
            refundType: 'Non-Refundable',
            markupType: 'Fixed',
            markupValue: 1000,
            priority: 10
        };

        const rule = await MarkupRule.findOneAndUpdate(
            { 
                serviceType: testRule.serviceType, 
                airline: testRule.airline, 
                refundType: testRule.refundType 
            }, 
            testRule, 
            { new: true, upsert: true, runValidators: true }
        );

        console.log('Upsert Success:', rule);
        process.exit(0);
    } catch (err) {
        console.error('Upsert Failed:', err.message);
        process.exit(1);
    }
};

testMarkup();
