const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
const Transaction = require('./src/Models/Transaction.model');
const Booking = require('./src/Models/Booking.model');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:2000/FTD_Zaha');
        console.log('Connected to MongoDB');

        const agent = await Agent.findOne();
        if (!agent) {
             console.log('No agents found');
             return;
        }
        console.log(`Checking stats for Agent: ${agent.agentName} (${agent._id})`);

        const txCount = await Transaction.countDocuments({ agentId: agent._id });
        const bookCount = await Booking.countDocuments({ agentId: agent._id });

        console.log(`Transaction Count: ${txCount}`);
        console.log(`Booking Count: ${bookCount}`);

        const txStats = await Transaction.aggregate([
            { $match: { agentId: agent._id } },
            { $group: { _id: '$transactionType', total: { $sum: '$amount' } } }
        ]);
        console.log('Transaction Stats:', txStats);

        const bookStats = await Booking.aggregate([
            { $match: { agentId: agent._id, status: 'CONFIRMED' } },
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]);
        console.log('Booking Stats (Confirmed Sum):', bookStats);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
