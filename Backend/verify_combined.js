const { applyAdminMarkup } = require('./src/controllers/ftdFlight.controller');
const MarkupRule = require('./src/Models/MarkupRule.model');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const verifyCombinedMarkup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Create a dummy rule for combined Refundable & P Refundable
        await MarkupRule.deleteOne({ refundType: 'Refundable & P Refundable' });
        const rule = await MarkupRule.create({
            serviceType: 'DOMESTIC_FLIGHT',
            airline: 'ALL',
            refundType: 'Refundable & P Refundable',
            markupType: 'Fixed',
            markupValue: 777,
            priority: 5,
            isActive: true
        });

        console.log('Test Rule Created:', rule.refundType);

        // 2. Test data
        const flights = [
            { airlineIata: '6E', refundType: 'Refundable', price: 1000, netfare: 900 },
            { airlineIata: 'SG', refundType: 'P Refundable', price: 1000, netfare: 900 },
            { airlineIata: 'IX', refundType: 'Non-Refundable', price: 1000, netfare: 900 }
        ];

        // 3. Apply
        const result = await applyAdminMarkup(flights);

        console.log('Results:');
        result.forEach(f => {
            console.log(`${f.refundType}: Price ${f.price} (Markup: ${f.adminMarkupApplied || 0})`);
        });

        // Clean up
        await MarkupRule.deleteOne({ _id: rule._id });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyCombinedMarkup();
