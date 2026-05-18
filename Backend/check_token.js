const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const { getDailyTokenCount, getTokenStatus } = require('./src/services/ftdTokenService');

async function checkToken() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const status = await getTokenStatus();
        console.log('Token Status:', JSON.stringify(status, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

checkToken();
